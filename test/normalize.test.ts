import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { normalizeOpts, prettyPrint } from '@/utils'

let logSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('normalizeOpts - 默认值', () => {
  it('空配置时返回全部文档化的默认颜色', () => {
    const opts = normalizeOpts({})
    expect(opts.infoColor).toBe('#909399')
    expect(opts.errorColor).toBe('#F56C6C')
    expect(opts.warningColor).toBe('#E6A23C')
    expect(opts.successColor).toBe('#67C23A')
  })

  it('空配置时返回默认的表格颜色结构', () => {
    const opts = normalizeOpts({})
    expect(opts.table).toEqual({
      header: { color: '#F2F7FF', bgc: '#1455CC' },
      row: { color: '#FFF', bgc: '#656C66' },
    })
  })

  it('空配置时 needLog 默认返回 true', () => {
    const opts = normalizeOpts({})
    expect(typeof opts.needLog).toBe('function')
    expect(opts.needLog()).toBe(true)
  })

  it('返回对象包含所有默认键', () => {
    const opts = normalizeOpts({})
    expect(opts).toMatchObject({
      infoColor: '#909399',
      errorColor: '#F56C6C',
      warningColor: '#E6A23C',
      successColor: '#67C23A',
    })
  })
})

describe('normalizeOpts - 用户覆盖', () => {
  it('用户传入的颜色覆盖默认值', () => {
    const opts = normalizeOpts({ infoColor: '#000000', errorColor: '#111111' })
    expect(opts.infoColor).toBe('#000000')
    expect(opts.errorColor).toBe('#111111')
    // 未覆盖的保持默认
    expect(opts.warningColor).toBe('#E6A23C')
    expect(opts.successColor).toBe('#67C23A')
  })

  it('用户传入的 table 整体覆盖默认 table（spread 浅合并）', () => {
    const customTable = { header: { color: '#aaa', bgc: '#bbb' } }
    const opts = normalizeOpts({ table: customTable })
    expect(opts.table).toBe(customTable)
    expect(opts.table).toEqual({ header: { color: '#aaa', bgc: '#bbb' } })
  })

  it('用户自定义 needLog 被保留并生效', () => {
    const custom = () => false
    const opts = normalizeOpts({ needLog: custom })
    expect(opts.needLog).toBe(custom)
    expect(opts.needLog()).toBe(false)
  })

  it('透传 BaseLogOpts 字段（debug / prefix）', () => {
    const opts = normalizeOpts({ debug: true, prefix: 'X' }) as any
    expect(opts.debug).toBe(true)
    expect(opts.prefix).toBe('X')
  })

  it('每次调用返回新对象，互不影响', () => {
    const a = normalizeOpts({})
    const b = normalizeOpts({})
    expect(a).not.toBe(b)
    // 颜色等普通字段相等，table 结构深相等
    expect(a.infoColor).toBe(b.infoColor)
    expect(a.table).toEqual(b.table)
  })
})

describe('prettyPrint - needLog 门控', () => {
  it('needLog 返回 false 时不打印任何内容', () => {
    prettyPrint('Info', 'hello', '#909399', () => false)
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('needLog 返回 true 时打印一次', () => {
    prettyPrint('Info', 'hello', '#909399', () => true)
    expect(logSpy).toHaveBeenCalledTimes(1)
  })

  it('省略 needLog 参数时使用默认值并打印', () => {
    prettyPrint('Success', 'done', '#67C23A')
    expect(logSpy).toHaveBeenCalledTimes(1)
  })
})

describe('prettyPrint - 输出格式', () => {
  it('format 字符串使用 %c 占位并嵌入 title 与 text', () => {
    prettyPrint('Info', 'hello world', '#909399')
    const args = logSpy.mock.calls[0]
    const format = args[0] as string
    expect(format).toContain('%c')
    expect(format).toContain('Info')
    expect(format).toContain('hello world')
    // 三段 %c
    expect(format.match(/%c/g)?.length).toBe(3)
  })

  it('样式参数嵌入传入的颜色值', () => {
    const color = '#F56C6C'
    prettyPrint('Error', 'boom', color)
    const args = logSpy.mock.calls[0]
    // args: [format, style1, style2, 'background:transparent']
    expect(args[1]).toContain(`background:${color}`)
    expect(args[1]).toContain(`border:1px solid ${color}`)
    expect(args[2]).toContain(`color: ${color}`)
    expect(args[3]).toBe('background:transparent')
  })

  it('console.log 接收四个参数（format + 两段样式 + 透明背景）', () => {
    prettyPrint('Warning', 'careful', '#E6A23C')
    const args = logSpy.mock.calls[0]
    expect(args).toHaveLength(4)
  })

  it('不同 title 会原样出现在 format 中', () => {
    prettyPrint('Debug', 'trace', '#909399')
    const format = logSpy.mock.calls[0][0] as string
    expect(format).toContain('Debug')
    expect(format).toContain('trace')
  })

  it('对象类型的 text 会被序列化为 JSON 字符串', () => {
    // @ts-expect-error 故意传入对象以验证序列化分支
    prettyPrint('Info', { a: 1, b: 'x' }, '#909399')
    const format = logSpy.mock.calls[0][0] as string
    expect(format).toContain(JSON.stringify({ a: 1, b: 'x' }))
  })
})
