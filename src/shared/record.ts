import type { LogLevel, LogRecordPayload } from './ipc'

/** 创建一条结构化日志记录 */
export function createLogRecord(
  level: LogLevel,
  message: string,
  opts: CreateLogRecordOptions = {}
): LogRecordPayload {
  const record: LogRecordPayload = {
    level,
    message,
    time: opts.time ?? new Date().toISOString(),
  }
  if (opts.detail !== undefined) {
    record.detail = opts.detail
  }
  if (opts.meta !== undefined) {
    record.meta = opts.meta
  }

  return record
}

/** 创建结构化日志记录时的可选字段 */
export interface CreateLogRecordOptions {
  /** 附加详情（错误堆栈、可序列化对象等） */
  detail?: unknown
  /** 记录产生时间（ISO 字符串），不传则用当前时间 */
  time?: string
  /** 本条日志的结构化上下文字段 */
  meta?: Record<string, unknown>
}
