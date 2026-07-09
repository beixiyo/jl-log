/**
 * 文件日志传输
 *
 * 把日志写入本地文件，并通过「可选 peer 依赖」`rotating-file-stream`
 * 实现按大小 / 时间轮转、gzip 压缩与保留清理
 *
 * - 仅 Node 环境可用，浏览器入口不会引入本模块
 * - `rotating-file-stream` 为可选依赖，使用文件日志前需自行安装：`pnpm add rotating-file-stream`
 * - 写入文件的内容为「去除 ANSI 颜色」的纯文本，终端彩色输出不受影响
 */

import { basename, dirname } from 'node:path'
import type { FileLogFormat, FileLogFormatFn, FileLogOptions } from './types'
import type { LogLevel, LogRecordPayload, LogTransport } from '../shared/ipc'
import { createLogRecord } from '../shared/record'

/** 可选接管的终止信号 */
const SIGNALS = ['SIGINT', 'SIGTERM'] as const

type Signal = (typeof SIGNALS)[number]

/** 各信号对应的惯例退出码（128 + 信号编号） */
const SIGNAL_EXIT_CODE: Record<Signal, number> = {
  SIGINT: 130,
  SIGTERM: 143,
}

export class FileTransport implements LogTransport {
  private readonly opts: FileLogOptions & { format: FileLogFormat | FileLogFormatFn }
  private stream: RotatingStream | null = null
  /** rfs 就绪前先缓存日志行，就绪后回放 */
  private buffer: string[] = []
  private closed = false
  private closePromise: Promise<void> | null = null
  /** 首次写入时异步初始化（动态加载 rfs + 建流）完成的 Promise */
  private ready: Promise<void> | null = null

  constructor(opts: FileLogOptions) {
    this.opts = { format: 'jsonl', autoClose: true, handleSignals: false, ...opts }

    // 默认监听进程自然退出（beforeExit），自动刷新关闭，无需手动调用 close()
    if (this.opts.autoClose) {
      process.once('beforeExit', this.handleBeforeExit)
    }

    // 可选：接管 SIGINT/SIGTERM —— 刷新关闭后按惯例退出码退出进程
    if (this.opts.handleSignals) {
      for (const signal of SIGNALS) {
        process.once(signal, this.handleSignal)
      }
    }
  }

  /** 进程自然退出时自动刷新关闭 */
  private handleBeforeExit = (): void => {
    void this.close()
  }

  /** 收到终止信号时刷新关闭，再按惯例退出码退出进程 */
  private handleSignal = (signal: NodeJS.Signals): void => {
    void this.close().finally(() => {
      process.exit(SIGNAL_EXIT_CODE[signal as Signal] ?? 0)
    })
  }

  /**
   * 写入一条日志。传 record 时使用标准 transport 接口；
   * 传 level/message 时保持旧版调用兼容
   *
   * @param opts.time 记录产生时间（ISO 字符串），不传则用当前时间；跨进程转发时传入产生端时间
   * @param opts.detail 附加详情（错误堆栈、可序列化对象等）
   * @param opts.meta 本条日志的结构化字段，与构造期 meta 合并（本条优先）
   */
  write(record: LogRecordPayload): void
  write(level: LogLevel, message: string, opts?: FileTransportWriteOptions): void
  write(
    recordOrLevel: LogRecordPayload | LogLevel,
    message = '',
    opts: FileTransportWriteOptions = {}
  ): void {
    if (this.closed) return

    const record = typeof recordOrLevel === 'string'
      ? createLogRecord(recordOrLevel, message, opts)
      : recordOrLevel
    const line = this.format(record)
    if (this.stream) {
      this.stream.write(line)
    }
    else {
      this.buffer.push(line)
      void this.ensureReady()
    }
  }

  /**
   * 刷新并关闭文件流（幂等）
   *
   * 默认已监听进程自然退出（beforeExit）自动调用；信号（SIGINT/SIGTERM）
   * 或框架退出钩子（如 Electron 的 before-quit）需自行调用本方法
   */
  close(): Promise<void> {
    if (!this.closePromise) {
      this.closePromise = this.doClose()
    }
    return this.closePromise
  }

  private async doClose(): Promise<void> {
    this.closed = true
    process.removeListener('beforeExit', this.handleBeforeExit)
    for (const signal of SIGNALS) {
      process.removeListener(signal, this.handleSignal)
    }
    if (this.ready) {
      await this.ready
    }

    const stream = this.stream
    if (!stream) return

    await new Promise<void>((resolve) => {
      stream.end(() => resolve())
    })
  }

  private ensureReady(): Promise<void> {
    if (!this.ready) {
      this.ready = this.init()
    }

    return this.ready
  }

  private async init(): Promise<void> {
    let createStream: CreateStream

    try {
      const mod: any = await import('rotating-file-stream')
      createStream = mod.createStream
    }
    catch {
      console.error(
        '[@jl-org/log] File logging needs the optional dependency "rotating-file-stream". Install it with: pnpm add rotating-file-stream'
      )
      return
    }

    // 已关闭且无待写数据时，无需再建流（避免生成空文件）
    if (this.closed && this.buffer.length === 0) return

    const { path: filePath, size, interval, maxFiles, compress, rfsOptions } = this.opts

    // rfs 要求 filename 为「文件名」、目录通过 path 选项传入；
    // 直接传绝对/含目录路径会让默认的轮转文件名生成器产出错误路径，故在此拆分
    const merged: Record<string, any> = {
      path: dirname(filePath),
      size,
      interval,
      maxFiles,
      compress: compress ? 'gzip' : undefined,
      ...rfsOptions,
    }
    // rotating-file-stream 不接受「值为 undefined 的已知选项」，需剔除未设置的项
    const rfsOpts: Record<string, any> = {}
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined) rfsOpts[key] = value
    }

    const stream = createStream(basename(filePath), rfsOpts)

    stream.on('error', (err: Error) => {
      console.error('[@jl-org/log] File transport error:', err)
    })

    this.stream = stream

    // 回放就绪前缓存的日志
    if (this.buffer.length) {
      for (const line of this.buffer) {
        stream.write(line)
      }
      this.buffer = []
    }
  }

  private format(record: LogRecordPayload): string {
    const { level, message, detail, meta: callMeta } = record

    const date = new Date(record.time)

    // 构造期 meta（环境默认）与本条 meta 合并，同名时本条优先
    const ambient = typeof this.opts.meta === 'function'
      ? this.opts.meta()
      : this.opts.meta
    const meta = (ambient || callMeta)
      ? { ...ambient, ...callMeta }
      : undefined

    const { format } = this.opts

    // 完全自定义：交给用户函数掌控整行，时间从 record.date 自取（formatTime 不参与）
    if (typeof format === 'function') {
      const out = format({ date, level, message, detail, meta })
      return out.endsWith('\n') ? out : `${out}\n`
    }

    // 内置格式：formatTime 渲染 time 字段（默认 ISO UTC）
    const ts = this.opts.formatTime ? this.opts.formatTime(date) : date.toISOString()

    if (format === 'text') {
      const tail = detail === undefined
        ? ''
        : ` ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`

      return `${ts} ${level.toUpperCase().padEnd(7)} ${message}${tail}\n`
    }

    // jsonl：meta 先铺底，内置字段后写，保证 time / level / msg 不被 meta 覆盖
    const jsonRecord: LogRecord = {
      ...meta,
      time: ts,
      level,
      msg: message,
    }
    if (detail !== undefined) {
      jsonRecord.detail = detail
    }

    return `${JSON.stringify(jsonRecord)}\n`
  }
}

/** 单条写入的可选项 */
export interface FileTransportWriteOptions {
  /** 附加详情（错误堆栈、可序列化对象等） */
  detail?: unknown
  /** 记录产生时间（ISO 字符串），跨进程转发时为产生端时间 */
  time?: string
  /** 本条日志的结构化字段，与构造期 meta 合并（本条优先） */
  meta?: Record<string, unknown>
}

/** rfs 流的最小结构（避免对 rotating-file-stream 产生类型硬依赖） */
interface RotatingStream {
  write(chunk: string): boolean
  end(cb?: () => void): void
  on(event: string, listener: (...args: any[]) => void): unknown
}

type CreateStream = (filename: string, options?: Record<string, any>) => RotatingStream

/** jsonl 落盘记录结构（允许并入 meta 自定义字段） */
interface LogRecord {
  time: string | number
  level: LogLevel
  msg: string
  detail?: unknown
  [key: string]: unknown
}
