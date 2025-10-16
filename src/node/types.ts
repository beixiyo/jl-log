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
}
