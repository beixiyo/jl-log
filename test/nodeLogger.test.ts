import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NodeLogger, terminalColor, ANSI } from '@/node'

/**
 * NodeLogger / TerminalColor 测试
 *
 * 颜色处理依赖共享单例 `terminalColor`。
 * 默认在 beforeEach 中调用 `terminalColor.disable()`，
 * 让输出退化为纯文本（无 ANSI），从而进行稳定断言；
 * 需要验证 ANSI 时，在用例内部显式 `terminalColor.enable()`。
 */

let logSpy: ReturnType<typeof vi.spyOn>
let errorSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>
let writeSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  writeSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true as any)

  // 默认禁用颜色，保证输出为纯文本
  terminalColor.disable()
})

afterEach(() => {
  vi.restoreAllMocks()
  // 还原为禁用基线（每个用例 beforeEach 会重新设置）
  terminalColor.disable()
})

const calls = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.map(c => c[0])

describe('NodeLogger - 基础输出', () => {
  it('info 调用一次 console.log，无前缀时输出原始消息', () => {
    const logger = new NodeLogger({})
    logger.info('hello')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('hello')
  })

  it('success 调用 console.log 输出消息', () => {
    const logger = new NodeLogger({})
    logger.success('ok')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('ok')
  })

  it('warn 调用 console.log 输出消息', () => {
    const logger = new NodeLogger({})
    logger.warn('careful')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('careful')
  })

  it('error 调用 console.error 而非 console.log', () => {
    const logger = new NodeLogger({})
    logger.error('boom')

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toBe('boom')
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('debug 默认隐藏（debug=false），不打印', () => {
    const logger = new NodeLogger({})
    logger.debug('secret')

    expect(logSpy).not.toHaveBeenCalled()
  })

  it('debug 在构造器 debug:true 时显示', () => {
    const logger = new NodeLogger({ debug: true })
    logger.debug('visible')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('visible')
  })
})

describe('NodeLogger - transports', () => {
  it('把 Node 日志写入自定义 transport', () => {
    const write = vi.fn()
    const logger = new NodeLogger({
      prefix: 'Server',
      transports: [{ write }],
    })

    logger.warn('slow query', { meta: { queryId: 'q1' } })

    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0]).toMatchObject({
      level: 'warn',
      message: '[Server] slow query',
      meta: { queryId: 'q1' },
    })
    expect(typeof write.mock.calls[0][0].time).toBe('string')
  })

  it('error 写入 transport 时保留 detail', () => {
    const write = vi.fn()
    const logger = new NodeLogger({ transports: [{ write }] })
    const err = new Error('failed')
    err.stack = 'Error: failed\n    at test'

    logger.error('job failed', err)

    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0]).toMatchObject({
      level: 'error',
      message: 'job failed',
      detail: err.stack,
    })
  })

  it('needLog:false 时不会写入 transport', () => {
    const write = vi.fn()
    const logger = new NodeLogger({
      needLog: () => false,
      transports: [{ write }],
    })

    logger.info('hidden')

    expect(write).not.toHaveBeenCalled()
  })

  it('writeRecord 会把外部记录直接写入 transport', () => {
    const write = vi.fn()
    const logger = new NodeLogger({ transports: [{ write }] })
    const record = {
      level: 'info' as const,
      message: '[Renderer] clicked',
      time: '2026-06-27T03:00:00.000Z',
      meta: { page: 'Home' },
    }

    logger.writeRecord(record)

    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0]).toBe(record)
  })

  it('close() 会关闭所有自定义 transport', async () => {
    const closeA = vi.fn()
    const closeB = vi.fn()
    const logger = new NodeLogger({
      transports: [
        { write: vi.fn(), close: closeA },
        { write: vi.fn(), close: closeB },
      ],
    })

    await logger.close()

    expect(closeA).toHaveBeenCalledTimes(1)
    expect(closeB).toHaveBeenCalledTimes(1)
  })
})

describe('NodeLogger - needLog 门控', () => {
  it('needLog() 返回 false 时所有方法都不打印任何内容', () => {
    const logger = new NodeLogger({ needLog: () => false, debug: true, prefix: 'P' })

    logger.info('a')
    logger.success('b')
    logger.warn('c')
    logger.error('d', new Error('e'))
    logger.debug('f', { debug: true })
    logger.log('g')
    logger.newLine()
    logger.clearLine('h')
    logger.progress({ message: 'm', current: 1, total: 2 })
    logger.tableSimple({ k: 'v' })
    logger.table([{ x: 1 }])
    logger.img('http://x')

    expect(logSpy).not.toHaveBeenCalled()
    expect(errorSpy).not.toHaveBeenCalled()
    expect(warnSpy).not.toHaveBeenCalled()
    expect(writeSpy).not.toHaveBeenCalled()
  })

  it('needLog() 返回 true 时正常打印', () => {
    const logger = new NodeLogger({ needLog: () => true })
    logger.info('on')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('on')
  })
})

describe('NodeLogger - 构造器前缀', () => {
  it('构造器 prefix 生成 "[X] " 前缀', () => {
    const logger = new NodeLogger({ prefix: 'App' })
    logger.info('start')

    expect(logSpy.mock.calls[0][0]).toBe('[App] start')
  })

  it('前缀应用于 success / warn / error', () => {
    const logger = new NodeLogger({ prefix: 'App' })
    logger.success('s')
    logger.warn('w')
    logger.error('e')

    expect(logSpy.mock.calls[0][0]).toBe('[App] s')
    expect(logSpy.mock.calls[1][0]).toBe('[App] w')
    expect(errorSpy.mock.calls[0][0]).toBe('[App] e')
  })
})

describe('NodeLogger - 方法级配置覆盖', () => {
  it('config.prefix 临时覆盖前缀', () => {
    const logger = new NodeLogger({})
    logger.info('x', { prefix: 'TEMP' })

    expect(logSpy.mock.calls[0][0]).toBe('[TEMP] x')
  })

  it('config.prefix 覆盖构造器前缀', () => {
    const logger = new NodeLogger({ prefix: 'App' })
    logger.info('x', { prefix: 'OVERRIDE' })

    expect(logSpy.mock.calls[0][0]).toBe('[OVERRIDE] x')
  })

  it('空字符串前缀覆盖会移除前缀', () => {
    const logger = new NodeLogger({ prefix: 'App' })
    logger.info('x', { prefix: '' })

    expect(logSpy.mock.calls[0][0]).toBe('x')
  })

  it('config.debug:true 临时开启调试（构造器 debug=false）', () => {
    const logger = new NodeLogger({})
    logger.debug('shown', { debug: true })

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('shown')
  })

  it('config.debug:false 临时关闭调试（构造器 debug=true）', () => {
    const logger = new NodeLogger({ debug: true })
    logger.debug('hidden', { debug: false })

    expect(logSpy).not.toHaveBeenCalled()
  })

  it('debug 同时覆盖 prefix 与 debug', () => {
    const logger = new NodeLogger({})
    logger.debug('d', { prefix: 'DBG', debug: true })

    expect(logSpy.mock.calls[0][0]).toBe('[DBG] d')
  })
})

describe('NodeLogger - error 的各种形态', () => {
  it('传入 Error 时第二次 console.error 输出 stack', () => {
    const logger = new NodeLogger({})
    const err = new Error('went wrong')
    err.stack = 'Error: went wrong\n    at somewhere'

    logger.error('caught', err)

    expect(errorSpy).toHaveBeenCalledTimes(2)
    expect(errorSpy.mock.calls[0][0]).toBe('caught')
    expect(errorSpy.mock.calls[1][0]).toBe(err.stack)
  })

  it('Error 无 stack 时回退到 message', () => {
    const logger = new NodeLogger({})
    const err = new Error('only message')
    // @ts-expect-error 故意置空 stack 测试回退分支
    err.stack = undefined

    logger.error('caught', err)

    expect(errorSpy).toHaveBeenCalledTimes(2)
    expect(errorSpy.mock.calls[1][0]).toBe('only message')
  })

  it('传入普通对象时第二次 console.error 原样输出对象（禁用颜色）', () => {
    const logger = new NodeLogger({})
    const errObj = { code: 'ECONNREFUSED', port: 3000 }

    logger.error('json error', errObj)

    expect(errorSpy).toHaveBeenCalledTimes(2)
    expect(errorSpy.mock.calls[0][0]).toBe('json error')
    expect(errorSpy.mock.calls[1][0]).toEqual(errObj)
  })

  it('不传 error 参数时仅调用一次 console.error', () => {
    const logger = new NodeLogger({})
    logger.error('plain')

    expect(errorSpy).toHaveBeenCalledTimes(1)
  })

  it('error 为 null/falsy 时不触发第二次 console.error，且支持 prefix 覆盖', () => {
    const logger = new NodeLogger({})
    logger.error('temp err', null, { prefix: 'CRIT' })

    expect(errorSpy).toHaveBeenCalledTimes(1)
    expect(errorSpy.mock.calls[0][0]).toBe('[CRIT] temp err')
  })
})

describe('NodeLogger - progress 进度条', () => {
  it('sameLine 默认：未完成时仅一次 write，含 \\r 前缀、分数与进度条', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'task', current: 5, total: 10 })

    expect(writeSpy).toHaveBeenCalledTimes(1)
    const out = writeSpy.mock.calls[0][0] as string
    expect(out.startsWith('\r')).toBe(true)
    expect(out).toContain('task')
    expect(out).toContain('5/10')
    // 50% -> 10 个实心块 + 10 个空心块
    expect(out).toContain('█'.repeat(10))
    expect(out).toContain('░'.repeat(10))
  })

  it('current>=total：进度条到 100%，并额外写入换行', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'task', current: 10, total: 10 })

    expect(writeSpy).toHaveBeenCalledTimes(2)
    const bar = writeSpy.mock.calls[0][0] as string
    expect(bar).toContain('10/10')
    expect(bar).toContain('█'.repeat(20))
    expect(bar).not.toContain('░')
    expect(writeSpy.mock.calls[1][0]).toBe('\n')
  })

  it('sameLine:false 使用 console.log，不调用 process.stdout.write', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'task', current: 1, total: 2, sameLine: false })

    expect(writeSpy).not.toHaveBeenCalled()
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toContain('1/2')
  })

  it('displayType:percentage 显示百分比', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'm', current: 1, total: 4, displayType: 'percentage' })

    expect(writeSpy.mock.calls[0][0]).toContain('25%')
  })

  it('displayType:fraction 显示分数', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'm', current: 1, total: 4, displayType: 'fraction' })

    expect(writeSpy.mock.calls[0][0]).toContain('1/4')
  })

  it('displayType:auto 且 total>=1000 时显示百分比', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'm', current: 500, total: 1000, displayType: 'auto' })

    expect(writeSpy).toHaveBeenCalledTimes(1)
    expect(writeSpy.mock.calls[0][0]).toContain('50%')
  })

  it('customText 优先于 displayType', () => {
    const logger = new NodeLogger({})
    logger.progress({ message: 'm', current: 3, total: 9, customText: 'CUSTOM', displayType: 'percentage' })

    const out = writeSpy.mock.calls[0][0] as string
    expect(out).toContain('CUSTOM')
    expect(out).not.toContain('33%')
  })

  it('构造器前缀与 config.prefix 同时拼接到进度行', () => {
    const logger = new NodeLogger({ prefix: 'Task' })
    logger.progress({ message: 'm', current: 1, total: 2, prefix: 'P' })

    const out = writeSpy.mock.calls[0][0] as string
    expect(out).toContain('[Task] [P] m')
  })
})

describe('NodeLogger - clearLine / newLine / log', () => {
  it('clearLine 先写清除序列再写消息', () => {
    const logger = new NodeLogger({})
    logger.clearLine('done')

    expect(writeSpy).toHaveBeenCalledTimes(2)
    expect(writeSpy.mock.calls[0][0]).toBe('\r\x1b[K')
    expect(writeSpy.mock.calls[1][0]).toBe('done')
  })

  it('newLine 打印一个空字符串', () => {
    const logger = new NodeLogger({})
    logger.newLine()

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toBe('')
  })

  it('log 打印带前缀的青色文本（禁用颜色下为纯文本）', () => {
    const logger = new NodeLogger({ prefix: 'App' })
    logger.log('hi')

    expect(logSpy.mock.calls[0][0]).toBe('[App] hi')
  })

  it('log 在启用颜色时包含 cyan ANSI 码', () => {
    terminalColor.enable()
    const logger = new NodeLogger({})
    logger.log('hi')

    const out = logSpy.mock.calls[0][0] as string
    expect(out).toContain(ANSI.cyan)
    expect(out).toContain('hi')
    expect(out).toContain(ANSI.reset)
  })
})

describe('NodeLogger - tableSimple', () => {
  it('对键进行右侧填充并逐条打印，前后各一个空行', () => {
    const logger = new NodeLogger({})
    logger.tableSimple({ a: '1', bb: '2' })

    // newLine + 2 行 + newLine = 4 次
    expect(logSpy).toHaveBeenCalledTimes(4)
    const out = calls(logSpy)
    expect(out[0]).toBe('')
    // 'a' 被 padEnd 到 2 -> 'a '，与 '│' 之间再加一个空格 => 'a  │ 1'
    expect(out[1]).toBe('a  │ 1')
    expect(out[2]).toBe('bb │ 2')
    expect(out[3]).toBe('')
  })

  it('带构造器前缀时每行包含前缀', () => {
    const logger = new NodeLogger({ prefix: 'Info' })
    logger.tableSimple({ name: 'MyApp' })

    const out = calls(logSpy)
    expect(out[1]).toBe('[Info] name │ MyApp')
  })
})

describe('NodeLogger - 废弃方法触发 warn', () => {
  it('table() 已废弃，通过 warn 提示使用 tableSimple', () => {
    const logger = new NodeLogger({})
    logger.table([{ name: 'x' }])

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toContain('tableSimple')
  })

  it('img() 已废弃，通过 warn 提示仅浏览器可用', () => {
    const logger = new NodeLogger({})
    logger.img('https://example.com/a.png')

    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logSpy.mock.calls[0][0]).toContain('Image printing is only available in the browser')
  })
})

describe('NodeLogger - 自定义颜色配置', () => {
  it('启用颜色时 infoColor:"cyan.bold" 产生组合 ANSI 码', () => {
    terminalColor.enable()
    const logger = new NodeLogger({ colors: { infoColor: 'cyan.bold' } })
    logger.info('styled')

    const out = logSpy.mock.calls[0][0] as string
    expect(out).toContain(ANSI.cyan)
    expect(out).toContain(ANSI.bold)
    expect(out).toContain(ANSI.reset)
    expect(out).toContain('styled')
  })

  it('启用颜色时默认 infoColor 为 blue', () => {
    terminalColor.enable()
    const logger = new NodeLogger({})
    logger.info('x')

    expect(logSpy.mock.calls[0][0]).toContain(ANSI.blue)
  })

  it('启用颜色时 errorColor:"red.bold.bgWhite" 产生三段 ANSI 码', () => {
    terminalColor.enable()
    const logger = new NodeLogger({ colors: { errorColor: 'red.bold.bgWhite' } })
    logger.error('bad')

    const out = errorSpy.mock.calls[0][0] as string
    expect(out).toContain(ANSI.red)
    expect(out).toContain(ANSI.bold)
    expect(out).toContain(ANSI.bgWhite)
  })

  it('未知颜色名触发 console.warn（parseColor），但仍打印消息', () => {
    terminalColor.enable()
    const logger = new NodeLogger({ colors: { infoColor: 'notacolor' as any } })
    logger.info('still here')

    expect(warnSpy).toHaveBeenCalled()
    expect(logSpy.mock.calls[0][0]).toContain('still here')
  })

  it('自定义 debugColor 在 debug 开启时生效', () => {
    terminalColor.enable()
    const logger = new NodeLogger({ debug: true, colors: { debugColor: 'blue.italic' } })
    logger.debug('dbg')

    const out = logSpy.mock.calls[0][0] as string
    expect(out).toContain(ANSI.blue)
    expect(out).toContain(ANSI.italic)
    expect(out).toContain('dbg')
  })
})

describe('TerminalColor 单例', () => {
  it('disable 后输出为纯文本，enable 后包裹 ANSI', () => {
    terminalColor.disable()
    expect(terminalColor.red('x')).toBe('x')
    expect(terminalColor.isEnabled()).toBe(false)

    terminalColor.enable()
    expect(terminalColor.isEnabled()).toBe(true)
    expect(terminalColor.red('x')).toBe(`${ANSI.red}x${ANSI.reset}`)
  })

  it('各基础颜色方法在启用时输出对应 ANSI', () => {
    terminalColor.enable()
    expect(terminalColor.green('g')).toBe(`${ANSI.green}g${ANSI.reset}`)
    expect(terminalColor.blue('b')).toBe(`${ANSI.blue}b${ANSI.reset}`)
    expect(terminalColor.gray('y')).toBe(`${ANSI.gray}y${ANSI.reset}`)
    expect(terminalColor.cyan('c')).toBe(`${ANSI.cyan}c${ANSI.reset}`)
  })

  it('修饰方法 bold/dim/underline 输出对应 ANSI', () => {
    terminalColor.enable()
    expect(terminalColor.bold('t')).toBe(`${ANSI.bold}t${ANSI.reset}`)
    expect(terminalColor.dim('t')).toBe(`${ANSI.dim}t${ANSI.reset}`)
    expect(terminalColor.underline('t')).toBe(`${ANSI.underline}t${ANSI.reset}`)
  })

  it('reset 方法包裹 reset 码', () => {
    terminalColor.enable()
    expect(terminalColor.reset('t')).toBe(`${ANSI.reset}t${ANSI.reset}`)
  })

  it('parseColor 链式解析多段并按顺序拼接 ANSI', () => {
    terminalColor.enable()
    const fn = terminalColor.parseColor('red.bold')
    expect(fn('t')).toBe(`${ANSI.red}${ANSI.bold}t${ANSI.reset}`)
  })

  it('parseColor 遇到未知段会 console.warn 并跳过该段', () => {
    terminalColor.enable()
    const fn = terminalColor.parseColor('red.bogus' as any)
    expect(warnSpy).toHaveBeenCalled()
    // 仅有效的 red 段被拼接
    expect(fn('t')).toBe(`${ANSI.red}t${ANSI.reset}`)
  })

  it('禁用时 parseColor 结果仍为纯文本', () => {
    terminalColor.disable()
    const fn = terminalColor.parseColor('green.bold')
    expect(fn('t')).toBe('t')
  })
})
