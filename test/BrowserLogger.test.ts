// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { BrowserLogger } from '@/index'

/**
 * BrowserLogger 测试（jsdom 环境）
 *
 * BrowserLogger 的所有彩色输出都经由 `prettyPrint` -> `console.log`，
 * 调用形如：console.log('%c Title %c text %c', styleA, styleB, 'background:transparent')
 * 因此第一个参数（格式串）必带 '%c' 前缀，且包含标题与（前缀 + 消息）文本。
 */

/** 取第 n 次 console.log 的格式串（第一个参数） */
function logFmt(spy: ReturnType<typeof vi.spyOn>, n = 0): string {
  return String((spy.mock.calls[n] ?? [])[0])
}

let logSpy: ReturnType<typeof vi.spyOn>
let errSpy: ReturnType<typeof vi.spyOn>
let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  errSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('BrowserLogger - 基础日志方法', () => {
  it('info 通过 console.log 输出 %c 前缀的格式串，包含标题与消息', () => {
    const logger = new BrowserLogger()
    logger.info('hello world')

    expect(logSpy).toHaveBeenCalledTimes(1)
    const fmt = logFmt(logSpy)
    expect(fmt).toMatch(/^%c/)
    expect(fmt).toContain('%c')
    expect(fmt).toContain('Info')
    expect(fmt).toContain('hello world')
    // prettyPrint 一共传入 4 个参数：格式串 + 两个样式 + 透明背景
    expect(logSpy.mock.calls[0].length).toBe(4)
  })

  it('success 输出 Success 标题', () => {
    const logger = new BrowserLogger()
    logger.success('done')

    expect(logSpy).toHaveBeenCalledTimes(1)
    const fmt = logFmt(logSpy)
    expect(fmt).toContain('%c')
    expect(fmt).toContain('Success')
    expect(fmt).toContain('done')
  })

  it('warn 输出 Warning 标题', () => {
    const logger = new BrowserLogger()
    logger.warn('careful')

    expect(logSpy).toHaveBeenCalledTimes(1)
    const fmt = logFmt(logSpy)
    expect(fmt).toContain('%c')
    expect(fmt).toContain('Warning')
    expect(fmt).toContain('careful')
  })

  it('error 输出 Error 标题（无 error 对象时不调用 console.error）', () => {
    const logger = new BrowserLogger()
    logger.error('boom')

    expect(logSpy).toHaveBeenCalledTimes(1)
    const fmt = logFmt(logSpy)
    expect(fmt).toContain('%c')
    expect(fmt).toContain('Error')
    expect(fmt).toContain('boom')
    expect(errSpy).not.toHaveBeenCalled()
  })

  it('每个级别的格式串均以 %c 开头', () => {
    const logger = new BrowserLogger()
    logger.info('a')
    logger.success('b')
    logger.warn('c')
    logger.error('d')

    expect(logSpy).toHaveBeenCalledTimes(4)
    for (let i = 0; i < 4; i++) {
      expect(logFmt(logSpy, i)).toMatch(/^%c/)
    }
  })
})

describe('BrowserLogger - transports', () => {
  it('把浏览器日志写入自定义 transport，可用于 IndexedDB 等存储', () => {
    const write = vi.fn()
    const logger = new BrowserLogger({
      prefix: 'Page',
      transports: [{ write }],
    })

    logger.info('clicked', { meta: { buttonId: 'save' } })

    expect(write).toHaveBeenCalledTimes(1)
    expect(write.mock.calls[0][0]).toMatchObject({
      level: 'info',
      message: '[Page] clicked',
      meta: { buttonId: 'save' },
    })
    expect(typeof write.mock.calls[0][0].time).toBe('string')
  })

  it('needLog:false 时不会写入 transport', () => {
    const write = vi.fn()
    const logger = new BrowserLogger({
      needLog: () => false,
      transports: [{ write }],
    })

    logger.info('hidden')

    expect(write).not.toHaveBeenCalled()
  })

  it('close() 会关闭 transport', async () => {
    const close = vi.fn()
    const logger = new BrowserLogger({
      transports: [{ write: vi.fn(), close }],
    })

    await logger.close()

    expect(close).toHaveBeenCalledTimes(1)
  })
})

describe('BrowserLogger - 自定义颜色', () => {
  it('默认颜色会进入样式参数', () => {
    const logger = new BrowserLogger()
    logger.info('x')
    // 第二个参数是标题样式串，包含背景色
    expect(String(logSpy.mock.calls[0][1])).toContain('#909399')
  })

  it('自定义 infoColor / errorColor 透传到样式串', () => {
    const logger = new BrowserLogger({
      infoColor: '#00BCD4',
      errorColor: '#F44336',
    })

    logger.info('x')
    expect(String(logSpy.mock.calls[0][1])).toContain('#00BCD4')

    logger.error('y')
    expect(String(logSpy.mock.calls[1][1])).toContain('#F44336')
  })

  it('debug 默认颜色 #909399 进入样式参数', () => {
    const logger = new BrowserLogger({ debug: true })
    logger.debug('d')
    expect(String(logSpy.mock.calls[0][1])).toContain('#909399')
  })

  it('debug 颜色可通过 debugColor 配置', () => {
    const logger = new BrowserLogger({ debug: true, debugColor: '#123456' })
    logger.debug('d')
    expect(String(logSpy.mock.calls[0][1])).toContain('#123456')
    expect(String(logSpy.mock.calls[0][2])).toContain('#123456')
  })
})

describe('BrowserLogger - needLog 闸门 (false 时全部静默)', () => {
  it('needLog:()=>false 抑制 info/success/warn/error/debug/table/img 的所有输出', () => {
    const logger = new BrowserLogger({ needLog: () => false, debug: true })

    logger.info('a')
    logger.success('b')
    logger.warn('c')
    logger.error('d')
    logger.debug('e', { debug: true })
    logger.table([{ id: 1 }])
    logger.img('data:image/png;base64,AAAA')

    expect(logSpy).not.toHaveBeenCalled()
    expect(errSpy).not.toHaveBeenCalled()
  })

  it('needLog:()=>false 时 error(msg, errorObj) 不调用 console.error', () => {
    const logger = new BrowserLogger({ needLog: () => false })
    logger.error('failed', new Error('inner'))

    expect(logSpy).not.toHaveBeenCalled()
    expect(errSpy).not.toHaveBeenCalled()
  })

  it('动态 needLog 切换：返回 true 才输出', () => {
    let enabled = false
    const logger = new BrowserLogger({ needLog: () => enabled })

    logger.info('first')
    expect(logSpy).not.toHaveBeenCalled()

    enabled = true
    logger.info('second')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logFmt(logSpy)).toContain('second')
  })
})

describe('BrowserLogger - 前缀行为', () => {
  it('构造器 prefix 渲染为 "[X] " 并加在消息前', () => {
    const logger = new BrowserLogger({ prefix: 'X' })
    logger.info('hello')

    expect(logFmt(logSpy)).toContain('[X] hello')
  })

  it('无 prefix 时消息前无方括号', () => {
    const logger = new BrowserLogger()
    logger.info('plain')

    const fmt = logFmt(logSpy)
    expect(fmt).toContain('plain')
    expect(fmt).not.toContain('[')
  })

  it('方法级 {prefix} 覆盖构造器前缀', () => {
    const logger = new BrowserLogger({ prefix: 'X' })
    logger.success('msg', { prefix: 'TEMP' })

    const fmt = logFmt(logSpy)
    expect(fmt).toContain('[TEMP] msg')
    expect(fmt).not.toContain('[X]')
  })

  it('方法级 {prefix:""} 空串覆盖会移除前缀', () => {
    const logger = new BrowserLogger({ prefix: 'X' })
    logger.info('msg', { prefix: '' })

    const fmt = logFmt(logSpy)
    expect(fmt).toContain('msg')
    expect(fmt).not.toContain('[X]')
    expect(fmt).not.toContain('[')
  })

  it('未传 config 时沿用构造器前缀', () => {
    const logger = new BrowserLogger({ prefix: 'APP' })
    logger.warn('w')
    expect(logFmt(logSpy)).toContain('[APP] w')
  })
})

describe('BrowserLogger - debug 闸门', () => {
  it('默认 debug=false 时 debug() 不输出', () => {
    const logger = new BrowserLogger()
    logger.debug('hidden')
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('方法级 {debug:true} 临时开启 debug 输出', () => {
    const logger = new BrowserLogger()
    logger.debug('shown', { debug: true })

    expect(logSpy).toHaveBeenCalledTimes(1)
    const fmt = logFmt(logSpy)
    expect(fmt).toContain('Debug')
    expect(fmt).toContain('shown')
  })

  it('构造器 debug:true 时 debug() 默认输出', () => {
    const logger = new BrowserLogger({ debug: true })
    logger.debug('on')
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logFmt(logSpy)).toContain('on')
  })

  it('构造器 debug:true 时方法级 {debug:false} 可临时关闭', () => {
    const logger = new BrowserLogger({ debug: true })
    logger.debug('off', { debug: false })
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('needLog:false 优先级高于 {debug:true}', () => {
    const logger = new BrowserLogger({ needLog: () => false })
    logger.debug('msg', { debug: true })
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('debug 也支持前缀覆盖', () => {
    const logger = new BrowserLogger({ debug: true, prefix: 'D' })
    logger.debug('x', { prefix: 'OVR' })
    expect(logFmt(logSpy)).toContain('[OVR] x')
  })
})

describe('BrowserLogger - error(message, error)', () => {
  it('needLog=true 且传入 error 时，额外调用 console.error 输出 error', () => {
    const logger = new BrowserLogger()
    const err = new Error('inner error')
    logger.error('outer', err)

    // 彩色标题走 console.log
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logFmt(logSpy)).toContain('outer')
    // error 对象走 console.error
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(errSpy.mock.calls[0][0]).toBe(err)
  })

  it('error 为普通对象时也透传给 console.error', () => {
    const logger = new BrowserLogger()
    const errObj = { status: 404, message: 'Not Found' }
    logger.error('req failed', errObj)

    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(errSpy.mock.calls[0][0]).toBe(errObj)
  })

  it('error 携带方法级 {prefix} 时仍正常输出 console.error', () => {
    const logger = new BrowserLogger()
    const err = new Error('e')
    logger.error('boom', err, { prefix: 'API' })

    expect(logFmt(logSpy)).toContain('[API] boom')
    expect(errSpy).toHaveBeenCalledTimes(1)
    expect(errSpy.mock.calls[0][0]).toBe(err)
  })

  it('未传 error 时不调用 console.error', () => {
    const logger = new BrowserLogger()
    logger.error('only message')
    expect(errSpy).not.toHaveBeenCalled()
  })
})

describe('BrowserLogger - table', () => {
  it('空数组提前返回，不打印', () => {
    const logger = new BrowserLogger()
    logger.table([])
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('needLog=false 时不打印表格', () => {
    const logger = new BrowserLogger({ needLog: () => false })
    logger.table([{ id: 1, name: 'a' }])
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('单行数据：1 次表头 + 1 次数据行', () => {
    const logger = new BrowserLogger()
    logger.table([{ id: 1, name: 'Tom' }])

    expect(logSpy).toHaveBeenCalledTimes(2)
    // 表头格式串以 '%c ' 开头，包含所有键
    const header = logFmt(logSpy, 0)
    expect(header).toMatch(/^%c /)
    expect(header).toContain('id')
    expect(header).toContain('name')
    // 数据行包含值
    const row = logFmt(logSpy, 1)
    expect(row).toContain('1')
    expect(row).toContain('Tom')
  })

  it('多行数据：表头 + 每行各一次 console.log', () => {
    const logger = new BrowserLogger()
    logger.table([
      { id: 1, city: '北京' },
      { id: 2, city: '上海' },
      { id: 3, city: '广州' },
    ])
    // 1 表头 + 3 行
    expect(logSpy).toHaveBeenCalledTimes(4)
    expect(logFmt(logSpy, 1)).toContain('北京')
    expect(logFmt(logSpy, 2)).toContain('上海')
    expect(logFmt(logSpy, 3)).toContain('广州')
  })

  it('嵌套对象单元格会被 JSON.stringify', () => {
    const logger = new BrowserLogger()
    logger.table([{ id: 1, config: { theme: 'dark' } }])

    const row = logFmt(logSpy, 1)
    expect(row).toContain(JSON.stringify({ theme: 'dark' }))
    expect(row).toContain('{"theme":"dark"}')
  })

  it('数组单元格也会被 JSON.stringify', () => {
    const logger = new BrowserLogger()
    logger.table([{ id: 1, tags: ['a', 'b'] }])

    const row = logFmt(logSpy, 1)
    expect(row).toContain('["a","b"]')
  })

  it('表头与数据行各自附带与键数量一致的样式参数', () => {
    const logger = new BrowserLogger()
    logger.table([{ a: 1, b: 2, c: 3 }])

    // console.log(headerStr, ...genFormatter) -> 1 + keys.length 个参数
    expect(logSpy.mock.calls[0].length).toBe(1 + 3)
    expect(logSpy.mock.calls[1].length).toBe(1 + 3)
  })
})

describe('BrowserLogger - img (jsdom canvas 受限)', () => {
  /**
   * jsdom 默认未实现 HTMLCanvasElement.prototype.getContext / toDataURL，
   * 且不会真正加载图片（onload 不会自动触发）。
   * 这里通过桩函数让 onload 路径可被手动驱动，保持稳健。
   */
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      drawImage: () => {},
    } as any)
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue(
      'data:image/png;base64,FAKE'
    )
  })

  it('needLog=false 时提前返回，不创建 Image / canvas', () => {
    const created: any[] = []
    class FakeImage {
      onload: any = null
      crossOrigin = ''
      width = 4
      height = 3
      src = ''
      constructor() {
        created.push(this)
      }
    }
    vi.stubGlobal('Image', FakeImage)
    const ceSpy = vi.spyOn(document, 'createElement')

    const logger = new BrowserLogger({ needLog: () => false })
    logger.img('data:image/png;base64,AAAA')

    expect(created.length).toBe(0)
    expect(ceSpy).not.toHaveBeenCalledWith('canvas')
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('img(url) 同步调用不抛错（onload 异步、不立即触发）', () => {
    const logger = new BrowserLogger()
    expect(() => logger.img('data:image/png;base64,AAAA')).not.toThrow()
    // 同步阶段不应有日志输出（绘制发生在 onload 内）
    expect(logSpy).not.toHaveBeenCalled()
  })

  it('img 会设置图片 src 并在 onload 触发后输出图片日志', () => {
    const created: any[] = []
    class FakeImage {
      onload: any = null
      crossOrigin = ''
      width = 4
      height = 3
      src = ''
      constructor() {
        created.push(this)
      }
    }
    vi.stubGlobal('Image', FakeImage)

    const logger = new BrowserLogger()
    const url = 'data:image/png;base64,AAAA'
    logger.img(url, 2)

    // Image 被创建并设置了 src / crossOrigin
    expect(created.length).toBe(1)
    expect(created[0].src).toBe(url)
    expect(created[0].crossOrigin).toBe('anonymous')
    // 同步阶段未输出
    expect(logSpy).not.toHaveBeenCalled()

    // 手动触发 onload，驱动绘制 + 输出
    expect(() => created[0].onload()).not.toThrow()
    expect(logSpy).toHaveBeenCalledTimes(1)
    expect(logFmt(logSpy)).toContain('sup?')
    expect(String(logSpy.mock.calls[0][1])).toContain('data:image/png;base64,FAKE')
  })
})
