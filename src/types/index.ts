import type { LogRecordPayload } from '../shared/ipc'

/** 基础日志配置 */
export interface BaseLogOpts {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 日志前缀 */
  prefix?: string
  /** 是否需要打印，可根据环境配置，建议用构建工具删除打印 */
  needLog?: () => boolean
  /**
   * 每条日志产生时的订阅回调，收到一条「已拼好前缀」的结构化记录
   *
   * 典型用途是 Electron 渲染进程把日志经 IPC 转发到主进程落盘，
   * 可直接传入 {@link forwardToMain}；受 `needLog` 控制，被抑制的日志不会触发
   */
  onLog?: (record: LogRecordPayload) => void
}

/** 浏览器环境日志配置 */
export interface LogOpts extends BaseLogOpts {
  /** 默认 #909399 */
  infoColor?: string
  /** 默认 #F56C6C */
  errorColor?: string
  /** 默认 #E6A23C */
  warningColor?: string
  /** 默认 #67C23A */
  successColor?: string
  /** 默认 #909399 */
  debugColor?: string
  /** 表格颜色 */
  table?: {
    /** 表头 */
    header?: {
      /** 默认 #F2F7FF */
      color?: string
      /** 默认 #1455CC */
      bgc?: string
    },
    /** 行 */
    row?: {
      /** 默认 #FFF */
      color?: string
      /** 默认 #656C66 */
      bgc?: string
    }
  }
}

/** 方法级配置选项 - 允许临时覆盖构造器配置 */
export interface MethodConfig {
  /** 临时覆盖前缀 */
  prefix?: string
  /** 临时覆盖调试模式 */
  debug?: boolean
  /**
   * 本条日志的结构化上下文字段，写文件时并入 jsonl 顶层（如 `{ orderId, sku }`）
   *
   * 与文件配置里的「构造期 meta（环境默认）」合并，**同名时本条优先**；
   * Electron 渲染进程的 meta 会随 IPC 一并转发到主进程落盘
   */
  meta?: Record<string, unknown>
}

/** 统一的日志接口 - 定义两端都需要实现的基础方法 */
export interface ILogger {
  /** 普通信息日志 */
  info(message: string, config?: MethodConfig): void
  /** 成功信息日志 */
  success(message: string, config?: MethodConfig): void
  /** 警告信息日志 */
  warn(message: string, config?: MethodConfig): void
  /** 错误信息日志 */
  error(message: string, error?: any, config?: MethodConfig): void
  /** 调试信息日志 */
  debug?(message: string, config?: MethodConfig): void
  /** 打印图片 (仅浏览器环境支持) */
  img?(url: string, scale?: number): void
  /** 打印表格数据 */
  table?<T extends object>(data: T[]): void
}
