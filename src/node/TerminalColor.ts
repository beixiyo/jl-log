/**
 * 轻量级终端颜色工具
 * 支持 ANSI 颜色、粗体、斜体、下划线、删除线等功能
 */

import { ANSI } from './constans'
import type { ColorMethod, ColorString, AllAnsiCodes } from './types'

/** 颜色工具类 */
class TerminalColor {
  private enabled: boolean

  constructor() {
    // 检测终端是否支持颜色
    this.enabled = this.detectColorSupport()
  }

  /**
   * 检测终端颜色支持
   */
  private detectColorSupport(): boolean {
    // 检查环境变量
    if (process.env.NO_COLOR === '1' || process.env.FORCE_COLOR === '0') {
      return false
    }

    // 强制启用颜色
    if (process.env.FORCE_COLOR === '1' || process.env.FORCE_COLOR === 'true') {
      return true
    }

    // Windows 环境下的颜色支持检测
    if (process.platform === 'win32') {
      // Windows 10+ 支持 ANSI
      if (process.env.ConEmuANSI === 'ON') {
        return true
      }

      // Windows Terminal 和 PowerShell 7+ 支持 ANSI
      const wtSession = process.env.WT_SESSION
      const psVersion = process.env.PSVersion
      if (wtSession || psVersion) {
        return true
      }

      // 检查 Windows 版本（Windows 10 build 1511+ 支持 ANSI）
      const osRelease = process.env.OS
      if (osRelease && osRelease.includes('Windows')) {
        return true
      }

      // PowerShell 7+ 通常支持 ANSI
      if (process.env.PSModulePath && process.env.PSModulePath.includes('PowerShell')) {
        return true
      }

      // 现代 Windows 系统通常支持 ANSI（Windows 10 build 1511+）
      // 如果 TERM=dumb 但其他条件满足，也尝试启用颜色
      if (process.env.OS === 'Windows_NT' && process.env.PSModulePath) {
        return true
      }
    }

    // Unix/Linux/macOS 环境下的颜色支持检测
    const term = process.env.TERM
    if (term && (term.includes('color') || term.includes('256') || term.includes('truecolor'))) {
      return true
    }

    // 检查是否为 TTY
    if (process.stdout.isTTY) {
      return true
    }

    // 在非 TTY 环境下，如果看起来像终端环境，也尝试启用颜色
    // 这主要是为了支持 IDE 集成终端
    const hasTerminalEnv = process.env.TERM || process.env.COLORTERM || process.env.TERM_PROGRAM
    if (hasTerminalEnv) {
      return true
    }

    // 默认情况下禁用颜色
    return false
  }

  /**
   * 应用 ANSI 代码到文本
   */
  private applyAnsi(text: string, codes: string[]): string {
    if (!this.enabled) {
      return text
    }

    const startCode = codes.join('')
    return `${startCode}${text}${ANSI.reset}`
  }

  /**
   * 创建颜色方法
   */
  private createColorMethod(codes: string[]): ColorMethod {
    return (text: string) => this.applyAnsi(text, codes)
  }

  // 基本颜色方法
  black = this.createColorMethod([ANSI.black])
  red = this.createColorMethod([ANSI.red])
  green = this.createColorMethod([ANSI.green])
  yellow = this.createColorMethod([ANSI.yellow])
  blue = this.createColorMethod([ANSI.blue])
  magenta = this.createColorMethod([ANSI.magenta])
  cyan = this.createColorMethod([ANSI.cyan])
  white = this.createColorMethod([ANSI.white])
  gray = this.createColorMethod([ANSI.gray])
  grey = this.createColorMethod([ANSI.grey])

  // 背景颜色方法
  bgBlack = this.createColorMethod([ANSI.bgBlack])
  bgRed = this.createColorMethod([ANSI.bgRed])
  bgGreen = this.createColorMethod([ANSI.bgGreen])
  bgYellow = this.createColorMethod([ANSI.bgYellow])
  bgBlue = this.createColorMethod([ANSI.bgBlue])
  bgMagenta = this.createColorMethod([ANSI.bgMagenta])
  bgCyan = this.createColorMethod([ANSI.bgCyan])
  bgWhite = this.createColorMethod([ANSI.bgWhite])

  // 修饰方法
  bold = this.createColorMethod([ANSI.bold])
  dim = this.createColorMethod([ANSI.dim])
  italic = this.createColorMethod([ANSI.italic])
  underline = this.createColorMethod([ANSI.underline])
  inverse = this.createColorMethod([ANSI.inverse])
  hidden = this.createColorMethod([ANSI.hidden])
  strikethrough = this.createColorMethod([ANSI.strikethrough])

  /**
   * 重置所有样式
   */
  reset = (text: string) => this.applyAnsi(text, [ANSI.reset])

  /**
   * 禁用颜色输出
   */
  disable() {
    this.enabled = false
  }

  /**
   * 启用颜色输出
   */
  enable() {
    this.enabled = true
  }

  /**
   * 检查是否启用了颜色
   */
  isEnabled(): boolean {
    return this.enabled
  }

  /**
   * 解析颜色字符串并应用（支持链式调用如 'red.bold'）
   * @param colorString 颜色字符串，支持链式调用
   * @returns 颜色方法函数
   */
  parseColor<T extends ColorString>(colorString: T): ColorMethod {
    const parts = colorString.split('.') as AllAnsiCodes[]
    const codes: string[] = []

    for (const part of parts) {
      const ansiCode = ANSI[part as keyof typeof ANSI]
      if (ansiCode) {
        codes.push(ansiCode)
      }
      else {
        console.warn(`Warning: Unknown color/modifier '${part}'`)
      }
    }

    return this.createColorMethod(codes)
  }
}

// 创建单例实例
export const terminalColor = new TerminalColor()
