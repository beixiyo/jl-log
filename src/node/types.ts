import type { BaseLogOpts } from '../types'
import type { ANSI } from './constans'

/** 颜色方法类型 */
export type ColorMethod = (text: string) => string

/** 基本颜色类型 */
export type BasicColor = 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey'

/** 背景颜色类型 */
export type BackgroundColor = 'bgBlack' | 'bgRed' | 'bgGreen' | 'bgYellow' | 'bgBlue' | 'bgMagenta' | 'bgCyan' | 'bgWhite'

/** 文本修饰类型 */
export type TextModifier = 'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 'hidden' | 'strikethrough'

/** 所有可用的 ANSI 代码类型 */
export type AllAnsiCodes = BasicColor | BackgroundColor | TextModifier | 'reset'

/** 颜色字符串类型（支持链式调用） */
export type ColorString =
  | BasicColor
  | BackgroundColor
  | TextModifier
  | `${BasicColor}.${TextModifier}`
  | `${BasicColor}.${BackgroundColor}`
  | `${BackgroundColor}.${TextModifier}`
  | `${TextModifier}.${BasicColor}`
  | `${TextModifier}.${BackgroundColor}`
  | `${BasicColor}.${TextModifier}.${BackgroundColor}`
  | `${BackgroundColor}.${TextModifier}.${BasicColor}`
  | `${TextModifier}.${BasicColor}.${BackgroundColor}`
  | `${TextModifier}.${BackgroundColor}.${BasicColor}`
  | (string & {}) // 允许其他字符串，但会给出警告

/** ANSI 代码映射类型 */
export type AnsiCodeMap = {
  [K in keyof typeof ANSI]: typeof ANSI[K]
}


/** 进度条显示类型 */
export type ProgressDisplayType = 'percentage' | 'fraction' | 'auto'

/** 进度配置接口 */
export interface ProgressConfig {
  /** 进度消息 */
  message: string
  /** 当前进度 */
  current: number
  /** 总进度 */
  total: number
  /** 前缀 */
  prefix?: string
  /** 显示类型 */
  displayType?: ProgressDisplayType
  /** 自定义文本 */
  customText?: string
  /** 是否在同一行显示 */
  sameLine?: boolean
}

/** TerminalColor 颜色配置 */
export interface TerminalColorConfig {
  /** 信息日志颜色，支持 TerminalColor 的颜色方法和链式调用，如 'blue' 或 'blue.bold'，默认: 'blue' */
  infoColor?: ColorString
  /** 成功日志颜色，默认: 'green' */
  successColor?: ColorString
  /** 警告日志颜色，默认: 'yellow' */
  warningColor?: ColorString
  /** 错误日志颜色，默认: 'red' */
  errorColor?: ColorString
  /** 调试日志颜色，默认: 'gray' */
  debugColor?: ColorString
}

/** Node.js 日志配置 */
export interface NodeLogOpts extends BaseLogOpts {
  /** 颜色配置 */
  colors?: TerminalColorConfig
  /** 文件日志配置，启用后日志会同时写入本地文件（基于可选依赖 rotating-file-stream 实现轮转） */
  file?: FileLogOptions
}

import type { LogLevel } from '../shared/ipc'

/** 内置落盘格式 */
export type FileLogFormat = 'jsonl' | 'text'

/** 传给自定义格式化函数的一条记录 */
export interface FileLogRecord {
  /** 该条日志的原始时间实例，自行格式化（如东八区、epoch）后写进结果 */
  date: Date
  /** 日志级别 */
  level: LogLevel
  /** 已拼好前缀的消息正文 */
  message: string
  /** 附加详情（错误堆栈、可序列化对象等） */
  detail?: unknown
  /** {@link FileLogOptions.meta} 解析后的固定字段 */
  meta?: Record<string, unknown>
}

/** 自定义落盘格式化函数，返回写入文件的一行（无需手动加换行，缺失时会自动补） */
export type FileLogFormatFn = (record: FileLogRecord) => string

/**
 * 文件日志配置
 *
 * 基于可选 peer 依赖 [rotating-file-stream](https://github.com/iccicci/rotating-file-stream) 实现日志轮转
 *
 * 说明：rotating-file-stream 仅支持「按大小」与「按时间」轮转，不支持「按行数」轮转；
 * 需要更精细的控制可通过 {@link FileLogOptions.rfsOptions} 透传原始配置
 */
export interface FileLogOptions {
  /** 日志文件路径，相对或绝对均可，所在目录不存在时会自动创建 */
  path: string
  /**
   * 落盘格式：
   * - `'jsonl'`（默认）即 JSON Lines，每行一个 JSON 对象（机器友好，可 tail / grep / jq）
   * - `'text'` 带时间戳的纯文本行
   * - 传入函数则**完全自定义**每行内容，函数收到结构化记录、返回字符串（缺失换行会自动补）
   * @default 'jsonl'
   */
  format?: FileLogFormat | FileLogFormatFn
  /**
   * 格式化 `time` 字段：入参是该条日志的原始时间实例（跨进程转发时为产生端时间），
   * 返回写入的时间（字符串或 epoch 毫秒数字）。默认 ISO 8601 UTC，可返回
   * `date.getTime()` 得数字 epoch，或自定义本地格式
   *
   * 仅作用于内置 `'jsonl'` / `'text'` 格式；用了自定义 `format` 函数时本项不生效，
   * 请在函数里从 `record.date` 自行格式化
   *
   * 注意：用于按时间范围检索时，字符串需「定宽且带固定时区偏移」才能保证排序正确，
   * 否则建议用 UTC ISO 或数字 epoch（见 README）
   * @default (date) => date.toISOString()
   */
  formatTime?: (date: Date) => string | number
  /**
   * 每条记录自动并入的固定字段，会写进 jsonl 顶层（如 `{ sessionId, appVersion }`）；
   * 自定义格式化函数可经 `record.meta` 读取。传函数则每条日志求值一次（适合动态值）
   *
   * 注意：内置 `time` / `level` / `msg` 字段优先，meta 不会覆盖它们
   *
   * @example
   * 多地区 App 想保留「用户本地时间 / 时区」又不破坏 time 的可排序性时，
   * 让 time 仍用 UTC / epoch，另把本地信息放进 meta（在产生端调用以抓到真实时区）：
   * ```ts
   * meta: () => ({
   *   localTime: new Date().toLocaleString(),                       // 用户当地可读时间
   *   tz: Intl.DateTimeFormat().resolvedOptions().timeZone,         // 如 'America/New_York'
   * })
   * ```
   */
  meta?: Record<string, unknown> | (() => Record<string, unknown>)
  /** 按大小轮转，如 `'10M'`、`'500K'`、`'1G'`（单位 B / K / M / G），可与 `interval` 同时使用 */
  size?: string
  /** 按时间轮转，如 `'1d'`、`'12h'`、`'30m'`、`'1M'`（单位 s / m / h / d / M） */
  interval?: string
  /** 最多保留的「轮转后」文件数量，超出后自动删除最旧的 */
  maxFiles?: number
  /**
   * 是否将轮转后的文件 gzip 压缩为 `.gz`
   * @default false
   */
  compress?: boolean
  /**
   * 是否在进程自然退出（beforeExit）时自动刷新并关闭文件流；
   * 信号（SIGINT/SIGTERM）与框架退出钩子（如 Electron 的 before-quit）不在此列
   * @default true
   */
  autoClose?: boolean
  /**
   * 是否接管 `SIGINT`/`SIGTERM` 信号：收到后先刷新关闭文件流，再按惯例退出码退出进程
   *
   * 仅适合「自身不管理信号 / 优雅退出」的应用；若你已有信号处理或框架退出钩子
   * （如 Electron 的 `app.on('before-quit')`），请保持关闭并在自己的钩子里调用 `close()`，
   * 否则会与宿主的关闭流程冲突
   * @default false
   */
  handleSignals?: boolean
  /**
   * 透传给 rotating-file-stream 的原始配置，会覆盖上面同名项，用于高度自定义
   *
   * 完整选项见 https://github.com/iccicci/rotating-file-stream
   */
  rfsOptions?: Record<string, any>
}
