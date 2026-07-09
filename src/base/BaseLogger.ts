import type { BaseLogOpts, MethodConfig } from '../types'
import type { LogLevel, LogRecordPayload, LogTransport } from '../shared/ipc'
import { createLogRecord } from '../shared/record'

/**
 * 基础日志类，包含两端通用的逻辑
 */
export abstract class BaseLogger {
  protected debugEnabled: boolean
  protected prefix: string = ''
  protected needLogFn: () => boolean
  protected onLog?: (record: LogRecordPayload) => void
  protected transports: LogTransport[]

  constructor(opts: BaseLogOpts) {
    this.debugEnabled = opts.debug ?? false
    this.needLogFn = opts.needLog ?? (() => true)
    this.onLog = opts.onLog
    this.transports = opts.transports ?? []

    if (opts.prefix) {
      this.prefix = `[${opts.prefix}] `
    }
  }

  /**
   * 向 `onLog` 订阅者和 `transports` 派发一条结构化记录（已拼好前缀）
   *
   * 受 `needLog` 控制，被抑制的日志不会派发
   */
  protected emitRecord(level: LogLevel, message: string, detail?: unknown, meta?: Record<string, unknown>): void {
    if (!this.shouldLog()) return

    this.dispatchNewRecord(level, message, detail, meta)
  }

  /** 创建并派发一条结构化日志记录，不经过 `needLog` 闸门 */
  protected dispatchNewRecord(level: LogLevel, message: string, detail?: unknown, meta?: Record<string, unknown>): void {
    this.dispatchRecord(createLogRecord(level, message, {
      detail,
      meta,
    }))
  }

  /** 直接派发一条外部记录，不重新计算时间或经过 `needLog` 闸门 */
  protected dispatchRecord(record: LogRecordPayload): void {
    this.onLog?.(record)

    for (const transport of this.transports) {
      try {
        const result = transport.write(record)
        if (isPromiseLike(result)) {
          void result.catch((err) => {
            console.error('[@jl-org/log] Log transport error:', err)
          })
        }
      }
      catch (err) {
        console.error('[@jl-org/log] Log transport error:', err)
      }
    }
  }

  /** 刷新并关闭所有传输目标 */
  protected async closeTransports(): Promise<void> {
    await Promise.all(
      this.transports.map(async (transport) => {
        await transport.close?.()
      })
    )
  }

  /**
   * 检查是否需要打印日志
   */
  protected shouldLog(): boolean {
    return this.needLogFn()
  }

  /**
   * 获取最终的前缀（支持方法级覆盖）
   */
  protected getFinalPrefix(config?: MethodConfig): string {
    if (config?.prefix !== undefined) {
      return config.prefix ? `[${config.prefix}] ` : ''
    }
    return this.prefix
  }

  /**
   * 检查是否应该显示调试日志（支持方法级覆盖）
   */
  protected shouldShowDebug(config?: MethodConfig): boolean {
    if (config?.debug !== undefined) {
      return config.debug
    }
    return this.debugEnabled
  }
}

function isPromiseLike(value: unknown): value is Promise<void> {
  return Boolean(value && typeof (value as Promise<void>).then === 'function')
}
