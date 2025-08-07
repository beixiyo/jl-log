import type { ILogger, MethodConfig } from '@/types'
import { BaseLogger } from '../base/BaseLogger'
import type { ProgressConfig, NodeLogOpts, KleurColorConfig } from './types'
import { Kleur } from 'kleur'

/**
 * Node.js 环境的日志管理类
 * 提供彩色打印和不同日志级别的功能
 */
export class NodeLogger extends BaseLogger implements ILogger {
  private kleur: Kleur
  private colors: Required<KleurColorConfig>

  /**
   * 构造函数
   * @param opts 配置选项
   */
  constructor(opts: NodeLogOpts) {
    super(opts)
    this.kleur = opts.kleur

    // 设置默认颜色配置
    this.colors = {
      infoColor: opts.colors?.infoColor || 'blue',
      successColor: opts.colors?.successColor || 'green',
      warningColor: opts.colors?.warningColor || 'yellow',
      errorColor: opts.colors?.errorColor || 'red',
      debugColor: opts.colors?.debugColor || 'gray'
    }
  }

  /**
   * 获取指定颜色的 kleur 方法
   */
  private getColorMethod(colorName: string): ((text: string) => string) {
    try {
      // 简单映射常用颜色
      const simpleColors: Record<string, (text: string) => string> = {
        'black': this.kleur.black,
        'red': this.kleur.red,
        'green': this.kleur.green,
        'yellow': this.kleur.yellow,
        'blue': this.kleur.blue,
        'magenta': this.kleur.magenta,
        'cyan': this.kleur.cyan,
        'white': this.kleur.white,
        'gray': this.kleur.gray,
        'grey': this.kleur.grey
      }

      // 如果是简单颜色，直接返回
      if (simpleColors[colorName]) {
        return simpleColors[colorName]
      }

      // 处理链式调用，如 'red.bold' 或 'blue.underline'
      const methods = colorName.split('.')
      let result = this.kleur as any

      for (const method of methods) {
        if (result && typeof result[method] === 'function') {
          result = result[method]()
        } else if (result && result[method]) {
          result = result[method]
        } else {
          console.warn(`Warning: kleur method '${method}' not found, using default color`)
          return this.kleur.white
        }
      }

      // 确保返回一个函数
      return typeof result === 'function' ? result : this.kleur.white
    } catch (error) {
      console.warn(`Error processing kleur color '${colorName}':`, error)
      return this.kleur.white
    }
  }

  /**
   * 普通信息日志
   */
  info(message: string, config?: MethodConfig) {
    if (!this.shouldLog()) return

    const finalPrefix = this.getFinalPrefix(config)
    const colorMethod = this.getColorMethod(this.colors.infoColor)
    console.log(colorMethod(`${finalPrefix}${message}`))
  }

  /**
   * 成功信息日志
   */
  success(message: string, config?: MethodConfig) {
    if (!this.shouldLog()) return

    const finalPrefix = this.getFinalPrefix(config)
    const colorMethod = this.getColorMethod(this.colors.successColor)
    console.log(colorMethod(`${finalPrefix}${message}`))
  }

  /**
   * 警告信息日志
   */
  warn(message: string, config?: MethodConfig) {
    if (!this.shouldLog()) return

    const finalPrefix = this.getFinalPrefix(config)
    const colorMethod = this.getColorMethod(this.colors.warningColor)
    console.log(colorMethod(`${finalPrefix}${message}`))
  }

  /**
   * 错误信息日志
   */
  error(message: string, error?: any, config?: MethodConfig) {
    if (!this.shouldLog()) return

    const finalPrefix = this.getFinalPrefix(config)
    const colorMethod = this.getColorMethod(this.colors.errorColor)
    console.error(colorMethod(`${finalPrefix}${message}`))
    if (error) {
      console.error(this.kleur.red(error instanceof Error ? error.stack || error.message : error))
    }
  }

  /**
   * 调试信息日志，仅在 debug 选项开启时显示
   */
  debug(message: string, config?: MethodConfig) {
    if (!this.shouldLog()) return

    const shouldShow = this.shouldShowDebug(config)
    if (shouldShow) {
      const finalPrefix = this.getFinalPrefix(config)
      const colorMethod = this.getColorMethod(this.colors.debugColor)
      console.log(colorMethod(`${finalPrefix}${message}`))
    }
  }

  /**
   * 显示进度条
   * @param config 进度配置
   */
  progress(config: ProgressConfig) {
    if (!this.shouldLog()) return

    const {
      message,
      current,
      total,
      prefix,
      displayType = 'auto',
      customText,
      sameLine = true
    } = config

    const percent = Math.round((current / total) * 100)
    const progressBar = this.getProgressBar(percent)
    const prefixText = prefix ? `[${prefix}] ` : ''

    let progressText: string
    if (customText) {
      progressText = customText
    }
    else {
      switch (displayType) {
        case 'percentage':
          progressText = `${percent}%`
          break
        case 'fraction':
          progressText = `${current}/${total}`
          break
        case 'auto':
        default:
          // 如果是小数值(可能是文件数量)，显示 "x/y"，否则显示百分比
          progressText = total < 1000
            ? `${current}/${total}`
            : `${percent}%`
          break
      }
    }

    if (sameLine) {
      // 使用 \r 确保在同一行更新，不换行
      process.stdout.write(`\r${this.prefix}${prefixText}${message} ${progressBar} ${progressText}`)

      // 只有在完成时才换行
      if (current >= total) {
        process.stdout.write('\n')
      }
    }
    else {
      // 正常换行显示
      console.log(`${this.prefix}${prefixText}${message} ${progressBar} ${progressText}`)
    }
  }

  /**
   * 生成进度条字符串
   */
  private getProgressBar(percent: number): string {
    const width = 20
    const completed = Math.floor(width * percent / 100)
    const remaining = width - completed

    return this.kleur.green('█'.repeat(completed)) + this.kleur.gray('░'.repeat(remaining))
  }

  /**
   * 清除当前行并替换为新消息
   */
  clearLine(message: string) {
    if (!this.shouldLog()) return

    process.stdout.write('\r\x1b[K') // 清除当前行
    process.stdout.write(message)
  }

  /**
   * 打印空行
   */
  newLine() {
    if (!this.shouldLog()) return

    console.log('')
  }

  /**
   * 打印普通文本
   */
  log(message: string) {
    if (!this.shouldLog()) return

    console.log(this.kleur.cyan(`${this.prefix}${message}`))
  }

  /**
   * 打印表格形式的数据
   * @deprecated 浏览器环境下的表格打印功能，Node.js 环境下不支持
   */
  table<T extends object>(data: T[]) {
    if (!this.shouldLog()) return

    // Node.js 环境下不支持复杂表格打印，提供简化实现
    this.warn('复杂表格打印功能仅在浏览器环境下可用，Node.js 环境请使用 tableSimple 方法')
  }

  /**
   * 打印简单的键值对表格（Node.js 专用）
   */
  tableSimple(data: Record<string, string>) {
    if (!this.shouldLog()) return

    const maxKeyLength = Math.max(...Object.keys(data).map(k => k.length))

    this.newLine()
    Object.entries(data).forEach(([key, value]) => {
      const paddedKey = key.padEnd(maxKeyLength)
      console.log(`${this.kleur.dim(this.prefix)}${this.kleur.bold().cyan(paddedKey)} ${this.kleur.dim('│')} ${value}`)
    })
    this.newLine()
  }

  /**
   * @deprecated 浏览器环境下的图片打印功能，Node.js 环境下不支持
   * @param url 图片地址 (Node.js 环境下忽略)
   * @param scale 缩放比例 (Node.js 环境下忽略)
   */
  img(url: string, scale = 1) {
    if (!this.shouldLog()) return

    // Node.js 环境下不支持图片打印，提供空实现
    this.warn('图片打印功能仅在浏览器环境下可用')
  }
}
