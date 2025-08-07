import type { Kleur } from 'kleur'
import type { BaseLogOpts } from '../types'

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

/** kleur 支持的颜色方法 */
export type KleurColor =
  | 'black' | 'red' | 'green' | 'yellow' | 'blue' | 'magenta' | 'cyan' | 'white' | 'gray' | 'grey'

/** kleur 支持的背景颜色方法 */
export type KleurBgColor =
  | 'bgBlack' | 'bgRed' | 'bgGreen' | 'bgYellow' | 'bgBlue' | 'bgMagenta' | 'bgCyan' | 'bgWhite'

/** kleur 支持的修饰符方法 */
export type KleurModifier =
  | 'reset' | 'bold' | 'dim' | 'italic' | 'underline' | 'inverse' | 'hidden' | 'strikethrough'

/** kleur 支持的所有颜色和修饰符方法（可以链式调用，如 'red.bold' 或 'blue.underline'） */
export type KleurColorString =
  | KleurColor
  | KleurBgColor
  | KleurModifier
  | `${KleurColor}.${KleurModifier}`
  | `${KleurColor}.${KleurBgColor}`
  | `${KleurBgColor}.${KleurModifier}`
  | `${KleurModifier}.${KleurColor}`
  | `${KleurModifier}.${KleurBgColor}`
  | (string & {})

/** Kleur 颜色配置 */
export interface KleurColorConfig {
  /** 信息日志颜色，支持 kleur 的颜色方法和链式调用，如 'blue' 或 'blue.bold'，默认: 'blue' */
  infoColor?: KleurColorString
  /** 成功日志颜色，默认: 'green' */
  successColor?: KleurColorString
  /** 警告日志颜色，默认: 'yellow' */
  warningColor?: KleurColorString
  /** 错误日志颜色，默认: 'red' */
  errorColor?: KleurColorString
  /** 调试日志颜色，默认: 'gray' */
  debugColor?: KleurColorString
}

/** Node.js 日志配置 */
export interface NodeLogOpts extends BaseLogOpts {
  /** Kleur 实例，用户需要自己传入 */
  kleur: Kleur
  /** 颜色配置 */
  colors?: KleurColorConfig
}