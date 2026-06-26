/**
 * TerminalColor 单例的单元测试
 *
 * 覆盖：
 * - enable() / disable() / isEnabled()
 * - 启用时颜色方法将文本包裹为 `<code>text<reset>`
 * - 禁用时颜色方法原样返回文本
 * - parseColor 多段组合、未知 token 警告并跳过
 * - 基本颜色 / 背景色 / 修饰符的前缀映射
 * - reset()
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ANSI, terminalColor } from '@/node'
import type { BasicColor } from '@/node'

/** 记录初始启用状态，测试结束后恢复，避免污染并发用例 */
const initialEnabled = terminalColor.isEnabled()

afterEach(() => {
  vi.restoreAllMocks()
  // 恢复单例初始状态
  if (initialEnabled) {
    terminalColor.enable()
  }
  else {
    terminalColor.disable()
  }
})

describe('TerminalColor: enable / disable / isEnabled', () => {
  it('enable() 使 isEnabled() 返回 true', () => {
    terminalColor.disable()
    expect(terminalColor.isEnabled()).toBe(false)

    terminalColor.enable()
    expect(terminalColor.isEnabled()).toBe(true)
  })

  it('disable() 使 isEnabled() 返回 false', () => {
    terminalColor.enable()
    expect(terminalColor.isEnabled()).toBe(true)

    terminalColor.disable()
    expect(terminalColor.isEnabled()).toBe(false)
  })

  it('多次切换状态保持幂等', () => {
    terminalColor.enable()
    terminalColor.enable()
    expect(terminalColor.isEnabled()).toBe(true)

    terminalColor.disable()
    terminalColor.disable()
    expect(terminalColor.isEnabled()).toBe(false)
  })
})

describe('TerminalColor: 启用时包裹 ANSI 代码', () => {
  beforeEach(() => {
    terminalColor.enable()
  })

  it('red() 以 ANSI.red 开头并以 ANSI.reset 结尾', () => {
    const out = terminalColor.red('hello')

    expect(out.startsWith(ANSI.red)).toBe(true)
    expect(out.endsWith(ANSI.reset)).toBe(true)
    expect(out).toContain('hello')
    expect(out).toBe(`${ANSI.red}hello${ANSI.reset}`)
  })

  it('基本颜色方法生成正确前缀', () => {
    const basics: [BasicColor, string][] = [
      ['black', ANSI.black],
      ['red', ANSI.red],
      ['green', ANSI.green],
      ['yellow', ANSI.yellow],
      ['blue', ANSI.blue],
      ['magenta', ANSI.magenta],
      ['cyan', ANSI.cyan],
      ['white', ANSI.white],
      ['gray', ANSI.gray],
      ['grey', ANSI.grey],
    ]

    for (const [name, code] of basics) {
      const out = terminalColor[name]('文本')
      expect(out, `方法 ${name}`).toBe(`${code}文本${ANSI.reset}`)
    }
  })

  it('背景色方法生成正确前缀', () => {
    const bgs: [keyof typeof terminalColor, string][] = [
      ['bgBlack', ANSI.bgBlack],
      ['bgRed', ANSI.bgRed],
      ['bgGreen', ANSI.bgGreen],
      ['bgYellow', ANSI.bgYellow],
      ['bgBlue', ANSI.bgBlue],
      ['bgMagenta', ANSI.bgMagenta],
      ['bgCyan', ANSI.bgCyan],
      ['bgWhite', ANSI.bgWhite],
    ]

    for (const [name, code] of bgs) {
      const fn = terminalColor[name] as (t: string) => string
      const out = fn('bg')
      expect(out, `方法 ${String(name)}`).toBe(`${code}bg${ANSI.reset}`)
    }
  })

  it('修饰符方法生成正确前缀', () => {
    const mods: [keyof typeof terminalColor, string][] = [
      ['bold', ANSI.bold],
      ['dim', ANSI.dim],
      ['italic', ANSI.italic],
      ['underline', ANSI.underline],
      ['inverse', ANSI.inverse],
      ['hidden', ANSI.hidden],
      ['strikethrough', ANSI.strikethrough],
    ]

    for (const [name, code] of mods) {
      const fn = terminalColor[name] as (t: string) => string
      const out = fn('mod')
      expect(out, `方法 ${String(name)}`).toBe(`${code}mod${ANSI.reset}`)
    }
  })

  it('gray 与 grey 输出一致（同一 ANSI 码）', () => {
    expect(terminalColor.gray('x')).toBe(terminalColor.grey('x'))
  })

  it('空字符串也被正确包裹', () => {
    expect(terminalColor.red('')).toBe(`${ANSI.red}${ANSI.reset}`)
  })
})

describe('TerminalColor: 禁用时原样返回', () => {
  beforeEach(() => {
    terminalColor.disable()
  })

  it('red() 禁用时不含任何 ANSI 码', () => {
    const out = terminalColor.red('hello')

    expect(out).toBe('hello')
    expect(out).not.toContain(ANSI.red)
    expect(out).not.toContain(ANSI.reset)
  })

  it('所有方法禁用时均原样返回', () => {
    expect(terminalColor.green('a')).toBe('a')
    expect(terminalColor.bgRed('b')).toBe('b')
    expect(terminalColor.bold('c')).toBe('c')
    expect(terminalColor.underline('d')).toBe('d')
  })

  it('parseColor 在禁用时也原样返回', () => {
    expect(terminalColor.parseColor('red.bold')('text')).toBe('text')
  })

  it('reset() 在禁用时原样返回', () => {
    expect(terminalColor.reset('text')).toBe('text')
  })
})

describe('TerminalColor: parseColor', () => {
  beforeEach(() => {
    terminalColor.enable()
  })

  it('parseColor("red.bold") 按顺序组合多个 ANSI 码', () => {
    const out = terminalColor.parseColor('red.bold')('text')

    // 顺序：red 在前，bold 在后
    expect(out).toBe(`${ANSI.red}${ANSI.bold}text${ANSI.reset}`)
    expect(out.startsWith(ANSI.red)).toBe(true)
    expect(out.indexOf(ANSI.red)).toBeLessThan(out.indexOf(ANSI.bold))
    expect(out.endsWith(ANSI.reset)).toBe(true)
  })

  it('parseColor 单段等价于直接颜色方法', () => {
    expect(terminalColor.parseColor('blue')('x')).toBe(terminalColor.blue('x'))
  })

  it('parseColor 三段组合保持声明顺序', () => {
    const out = terminalColor.parseColor('bgBlue.white.bold')('x')
    expect(out).toBe(`${ANSI.bgBlue}${ANSI.white}${ANSI.bold}x${ANSI.reset}`)
  })

  it('parseColor 遇到未知 token 时调用 console.warn 并跳过', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const out = terminalColor.parseColor('red.nope' as any)('text')

    expect(warnSpy).toHaveBeenCalledTimes(1)
    expect(warnSpy.mock.calls[0][0]).toContain('nope')
    // 未知 token 被跳过，仅保留 red
    expect(out).toBe(`${ANSI.red}text${ANSI.reset}`)
  })

  it('parseColor 全部为未知 token 时不含任何 ANSI 颜色码', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const out = terminalColor.parseColor('foo.bar' as any)('text')

    expect(warnSpy).toHaveBeenCalledTimes(2)
    // codes 为空，applyAnsi 用空前缀包裹，仍追加 reset
    expect(out).toBe(`text${ANSI.reset}`)
  })

  it('parseColor 已知 token 不触发警告', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    terminalColor.parseColor('green.underline')('x')

    expect(warnSpy).not.toHaveBeenCalled()
  })
})

describe('TerminalColor: reset()', () => {
  it('启用时 reset() 包裹 ANSI.reset 前后缀', () => {
    terminalColor.enable()
    const out = terminalColor.reset('text')

    expect(out).toBe(`${ANSI.reset}text${ANSI.reset}`)
    expect(out.startsWith(ANSI.reset)).toBe(true)
    expect(out.endsWith(ANSI.reset)).toBe(true)
  })
})
