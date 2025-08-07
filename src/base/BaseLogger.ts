import type { BaseLogOpts, MethodConfig } from '../types'

/**
 * 基础日志类，包含两端通用的逻辑
 */
export abstract class BaseLogger {
  protected debugEnabled: boolean
  protected prefix: string = ''
  protected needLogFn: () => boolean

  constructor(opts: BaseLogOpts) {
    this.debugEnabled = opts.debug ?? false
    this.needLogFn = opts.needLog ?? (() => true)

    if (opts.prefix) {
      this.prefix = `[${opts.prefix}] `
    }
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