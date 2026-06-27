import type { BaseLogOpts, MethodConfig } from '../types'
import type { LogLevel, LogRecordPayload } from '../shared/ipc'

/**
 * 基础日志类，包含两端通用的逻辑
 */
export abstract class BaseLogger {
  protected debugEnabled: boolean
  protected prefix: string = ''
  protected needLogFn: () => boolean
  protected onLog?: (record: LogRecordPayload) => void

  constructor(opts: BaseLogOpts) {
    this.debugEnabled = opts.debug ?? false
    this.needLogFn = opts.needLog ?? (() => true)
    this.onLog = opts.onLog

    if (opts.prefix) {
      this.prefix = `[${opts.prefix}] `
    }
  }

  /**
   * 向 `onLog` 订阅者派发一条结构化记录（已拼好前缀）
   *
   * 受 `needLog` 控制，被抑制的日志不会派发；未配置 `onLog` 时为空操作
   */
  protected emitRecord(level: LogLevel, message: string, detail?: unknown, meta?: Record<string, unknown>): void {
    if (!this.onLog || !this.shouldLog()) return

    const record: LogRecordPayload = {
      level,
      message,
      time: new Date().toISOString(),
    }
    if (detail !== undefined) {
      record.detail = detail
    }
    if (meta !== undefined) {
      record.meta = meta
    }

    this.onLog(record)
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