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

/** 落盘格式 */
export type FileLogFormat = 'ndjson' | 'text'

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
   * 落盘格式：`ndjson` 每行一个 JSON 对象（机器友好，可 tail / grep / jq）；`text` 为带时间戳的纯文本行
   * @default 'ndjson'
   */
  format?: FileLogFormat
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
