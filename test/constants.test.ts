/**
 * ANSI 常量映射表测试
 *
 * 校验关键转义序列取值正确，并确认整体为 as-const 形状：
 * 所有值均为以 '\x1b[' 开头的字符串。
 */

import { describe, expect, it } from 'vitest'
import { ANSI } from '@/node'

describe('ANSI: 关键转义序列取值', () => {
  it('reset 为 \\x1b[0m', () => {
    expect(ANSI.reset).toBe('\x1b[0m')
  })

  it('基本文本颜色取值正确', () => {
    expect(ANSI.black).toBe('\x1b[30m')
    expect(ANSI.red).toBe('\x1b[31m')
    expect(ANSI.green).toBe('\x1b[32m')
    expect(ANSI.yellow).toBe('\x1b[33m')
    expect(ANSI.blue).toBe('\x1b[34m')
    expect(ANSI.magenta).toBe('\x1b[35m')
    expect(ANSI.cyan).toBe('\x1b[36m')
    expect(ANSI.white).toBe('\x1b[37m')
  })

  it('gray 与 grey 同值（\\x1b[90m）', () => {
    expect(ANSI.gray).toBe('\x1b[90m')
    expect(ANSI.grey).toBe('\x1b[90m')
    expect(ANSI.gray).toBe(ANSI.grey)
  })

  it('背景颜色取值正确', () => {
    expect(ANSI.bgBlack).toBe('\x1b[40m')
    expect(ANSI.bgRed).toBe('\x1b[41m')
    expect(ANSI.bgGreen).toBe('\x1b[42m')
    expect(ANSI.bgYellow).toBe('\x1b[43m')
    expect(ANSI.bgBlue).toBe('\x1b[44m')
    expect(ANSI.bgMagenta).toBe('\x1b[45m')
    expect(ANSI.bgCyan).toBe('\x1b[46m')
    expect(ANSI.bgWhite).toBe('\x1b[47m')
  })

  it('文本修饰取值正确', () => {
    expect(ANSI.bold).toBe('\x1b[1m')
    expect(ANSI.dim).toBe('\x1b[2m')
    expect(ANSI.italic).toBe('\x1b[3m')
    expect(ANSI.underline).toBe('\x1b[4m')
    expect(ANSI.inverse).toBe('\x1b[7m')
    expect(ANSI.hidden).toBe('\x1b[8m')
    expect(ANSI.strikethrough).toBe('\x1b[9m')
  })
})

describe('ANSI: as-const 形状', () => {
  it('包含全部预期键', () => {
    const keys = Object.keys(ANSI)

    const expected = [
      'reset',
      'black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'gray', 'grey',
      'bgBlack', 'bgRed', 'bgGreen', 'bgYellow', 'bgBlue', 'bgMagenta', 'bgCyan', 'bgWhite',
      'bold', 'dim', 'italic', 'underline', 'inverse', 'hidden', 'strikethrough',
    ]

    for (const key of expected) {
      expect(keys, `缺少键 ${key}`).toContain(key)
    }
    expect(keys.length).toBe(expected.length)
  })

  it('所有值均为字符串', () => {
    for (const value of Object.values(ANSI)) {
      expect(typeof value).toBe('string')
    }
  })

  it('所有值均以 \\x1b[ 开头并以 m 结尾', () => {
    for (const [key, value] of Object.entries(ANSI)) {
      expect(value.startsWith('\x1b['), `键 ${key} 应以 ESC[ 开头`).toBe(true)
      expect(value, `键 ${key} 应匹配 ESC[<数字>m`).toMatch(/^\x1b\[\d+m$/)
    }
  })

  it('值无重复（gray/grey 除外）', () => {
    const values = Object.values(ANSI)
    const unique = new Set(values)
    // gray 与 grey 共享同一码，故唯一值比键数少 1
    expect(unique.size).toBe(values.length - 1)
  })
})
