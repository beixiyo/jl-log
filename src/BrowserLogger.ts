import type { LogOpts, ILogger, MethodConfig } from './types'
import { BaseLogger } from './base/BaseLogger'
import { normalizeOpts, prettyPrint } from './utils'

/**
 * 浏览器环境的日志实现类
 */
export class BrowserLogger extends BaseLogger implements ILogger {
  private opts: ReturnType<typeof normalizeOpts>

  constructor(opts: LogOpts = {}) {
    super(opts)
    this.opts = normalizeOpts(opts)
  }

  /**
   * 普通信息日志
   */
  info(message: string, config?: MethodConfig) {
    const finalPrefix = this.getFinalPrefix(config)
    prettyPrint(
      'Info',
      `${finalPrefix}${message}`,
      this.opts.infoColor,
      this.opts.needLog
    )
  }

  /**
   * 成功信息日志
   */
  success(message: string, config?: MethodConfig) {
    const finalPrefix = this.getFinalPrefix(config)
    prettyPrint(
      'Success',
      `${finalPrefix}${message}`,
      this.opts.successColor,
      this.opts.needLog
    )
  }

  /**
   * 警告信息日志
   */
  warn(message: string, config?: MethodConfig) {
    const finalPrefix = this.getFinalPrefix(config)
    prettyPrint(
      'Warning',
      `${finalPrefix}${message}`,
      this.opts.warningColor,
      this.opts.needLog
    )
  }

  /**
   * 错误信息日志
   */
  error(message: string, error?: any, config?: MethodConfig) {
    const finalPrefix = this.getFinalPrefix(config)
    prettyPrint(
      'Error',
      `${finalPrefix}${message}`,
      this.opts.errorColor,
      this.opts.needLog
    )
    if (this.opts.needLog() && error) {
      console.error(error)
    }
  }

  /**
   * 调试信息日志
   */
  debug(message: string, config?: MethodConfig) {
    if (!this.shouldLog()) return

    const shouldShow = this.shouldShowDebug(config)
    if (shouldShow) {
      const finalPrefix = this.getFinalPrefix(config)
      prettyPrint(
        'Debug',
        `${finalPrefix}${message}`,
        '#909399',
        this.opts.needLog
      )
    }
  }

  /**
   * 打印表格数据
   */
  table<T extends object>(data: T[]) {
    if (!this.opts.needLog() || !data.length) return

    const keys = Object.keys(data[0])
    const headerStr = '%c ' + keys.map(key => `${key}%c`)
      .join(' ')
      .slice(0, -2)

    const genFormatter = (color = '#F2F7FF', bgc = '#1455CC') => Array
      .from({ length: keys.length }, () =>
        `color: ${color}; background-color: ${bgc}; padding: 2px 10px;`
      )

    console.log(
      headerStr,
      ...genFormatter(this.opts.table.header!.color, this.opts.table.header!.bgc)
    )

    data.forEach((item: any) => {
      const headerStr = '%c' + keys
        .map((key) => {
          let val = item[key]
          if (typeof val === 'object') {
            val = JSON.stringify(val)
          }

          return `${val} %c`
        })
        .join(' ')
        .slice(0, -2)

      console.log(
        headerStr,
        ...genFormatter(this.opts.table.row!.color, this.opts.table.row!.bgc)
      )
    })
  }

  /**
   * 打印图片
   */
  img(url: string, scale = 1) {
    if (!this.opts.needLog()) return

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url

    const cvs = document.createElement('canvas')
    const ctx = cvs.getContext('2d')!

    img.onload = () => {
      cvs.width = img.width
      cvs.height = img.height
      ctx.drawImage(img, 0, 0)
      const dataUri = cvs.toDataURL('image/png')

      console.log(
        `%c sup?`,
        `font-size: 1px;
                    padding: ${Math.floor((img.height * scale) / 2)}px ${Math.floor((img.width * scale) / 2)}px;
                    background-image: url(${dataUri});
                    background-repeat: no-repeat;
                    background-size: ${img.width * scale}px ${img.height * scale}px;
                    color: transparent;
                `
      )
    }
  }

}
