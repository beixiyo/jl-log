/**
 * 跨进程日志契约
 *
 * 浏览器入口与 Node 入口共享，仅含纯类型与常量，不依赖任何运行时 API，
 * 因此两端都能安全引入，用于把「渲染进程日志」经 IPC 流转到「主进程」落盘
 */

/** 渲染进程 → 主进程的 IPC 通道名 */
export const JL_LOG_IPC_CHANNEL = '__JL_LOG__'

/** preload 经 contextBridge 暴露到 window 上的键名 */
export const JL_LOG_BRIDGE_KEY = '__JL_LOG_BRIDGE__'

/** 日志级别 */
export type LogLevel = 'info' | 'success' | 'warn' | 'error' | 'debug' | 'log'

/** 一条可跨进程传输的日志记录（需可被 structured clone 序列化） */
export interface LogRecordPayload {
  /** 日志级别 */
  level: LogLevel
  /** 已拼好前缀/作用域的消息正文 */
  message: string
  /** 附加详情（错误堆栈、可序列化对象等），会写入落盘记录的 detail 字段 */
  detail?: unknown
  /** ISO 时间戳，记录在「产生端」生成，便于按时间范围检索 */
  time: string
}

/** preload 暴露给渲染进程的桥接对象结构 */
export interface JlLogBridge {
  /** 把一条日志记录发往主进程 */
  send(record: LogRecordPayload): void
}
