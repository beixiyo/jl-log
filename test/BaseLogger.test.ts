import { describe, it, expect, vi, afterEach } from 'vitest'
import { BaseLogger } from '@/index'
import type { BaseLogOpts, MethodConfig } from '@/index'

/**
 * 测试用的具体子类，暴露 BaseLogger 的 protected 成员与方法，
 * 以便对抽象基类的通用逻辑进行单元测试。
 */
class TestLogger extends BaseLogger {
  constructor(opts: BaseLogOpts = {}) {
    super(opts)
  }

  /** 暴露 protected 字段 */
  getDebugEnabled(): boolean {
    return this.debugEnabled
  }

  getPrefix(): string {
    return this.prefix
  }

  getNeedLogFn(): () => boolean {
    return this.needLogFn
  }

  /** 暴露 protected 方法 */
  callShouldLog(): boolean {
    return this.shouldLog()
  }

  callGetFinalPrefix(config?: MethodConfig): string {
    return this.getFinalPrefix(config)
  }

  callShouldShowDebug(config?: MethodConfig): boolean {
    return this.shouldShowDebug(config)
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BaseLogger - 默认值', () => {
  it('未传任何配置时 debugEnabled 默认为 false', () => {
    const logger = new TestLogger()
    expect(logger.getDebugEnabled()).toBe(false)
  })

  it('未传任何配置时 needLogFn 默认返回 true', () => {
    const logger = new TestLogger()
    const fn = logger.getNeedLogFn()
    expect(typeof fn).toBe('function')
    expect(fn()).toBe(true)
  })

  it('未传任何配置时 prefix 默认为空字符串', () => {
    const logger = new TestLogger()
    expect(logger.getPrefix()).toBe('')
  })

  it('空对象配置等价于全部默认值', () => {
    const logger = new TestLogger({})
    expect(logger.getDebugEnabled()).toBe(false)
    expect(logger.getPrefix()).toBe('')
    expect(logger.getNeedLogFn()()).toBe(true)
  })
})

describe('BaseLogger - prefix 构造逻辑', () => {
  it('传入 prefix 时包装成 "[X] " 形式', () => {
    const logger = new TestLogger({ prefix: 'X' })
    expect(logger.getPrefix()).toBe('[X] ')
  })

  it('传入任意 prefix 文本都会被 [] 包裹并补尾随空格', () => {
    const logger = new TestLogger({ prefix: 'MyApp' })
    expect(logger.getPrefix()).toBe('[MyApp] ')
  })

  it('空字符串 prefix 视为 falsy，保持默认空前缀', () => {
    const logger = new TestLogger({ prefix: '' })
    expect(logger.getPrefix()).toBe('')
  })
})

describe('BaseLogger - debug 标志', () => {
  it('debug:true 时 debugEnabled 为 true', () => {
    const logger = new TestLogger({ debug: true })
    expect(logger.getDebugEnabled()).toBe(true)
  })

  it('debug:false 时 debugEnabled 为 false', () => {
    const logger = new TestLogger({ debug: false })
    expect(logger.getDebugEnabled()).toBe(false)
  })
})

describe('BaseLogger - shouldLog()', () => {
  it('默认 needLog 时 shouldLog() 返回 true', () => {
    const logger = new TestLogger()
    expect(logger.callShouldLog()).toBe(true)
  })

  it('needLog 返回 false 时 shouldLog() 返回 false', () => {
    const logger = new TestLogger({ needLog: () => false })
    expect(logger.callShouldLog()).toBe(false)
  })

  it('shouldLog() 每次都会重新执行 needLogFn（动态生效）', () => {
    let enabled = false
    const logger = new TestLogger({ needLog: () => enabled })
    expect(logger.callShouldLog()).toBe(false)
    enabled = true
    expect(logger.callShouldLog()).toBe(true)
  })

  it('shouldLog() 透传 needLogFn 的调用次数', () => {
    const spy = vi.fn(() => true)
    const logger = new TestLogger({ needLog: spy })
    logger.callShouldLog()
    logger.callShouldLog()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('BaseLogger - getFinalPrefix() 方法级覆盖', () => {
  it('config 为 undefined 时返回实例 prefix（无前缀）', () => {
    const logger = new TestLogger()
    expect(logger.callGetFinalPrefix(undefined)).toBe('')
  })

  it('config 为 undefined 时返回实例 prefix（带前缀）', () => {
    const logger = new TestLogger({ prefix: 'X' })
    expect(logger.callGetFinalPrefix(undefined)).toBe('[X] ')
  })

  it('config.prefix 提供时覆盖实例 prefix', () => {
    const logger = new TestLogger({ prefix: 'X' })
    expect(logger.callGetFinalPrefix({ prefix: 'Y' })).toBe('[Y] ')
  })

  it('config.prefix 为空字符串时移除前缀（显式覆盖）', () => {
    const logger = new TestLogger({ prefix: 'X' })
    expect(logger.callGetFinalPrefix({ prefix: '' })).toBe('')
  })

  it('config 不含 prefix 字段时回退到实例 prefix', () => {
    const logger = new TestLogger({ prefix: 'X' })
    expect(logger.callGetFinalPrefix({ debug: true })).toBe('[X] ')
  })

  it('实例无前缀但 config 提供 prefix 时使用 config', () => {
    const logger = new TestLogger()
    expect(logger.callGetFinalPrefix({ prefix: 'Z' })).toBe('[Z] ')
  })
})

describe('BaseLogger - shouldShowDebug() 方法级覆盖', () => {
  it('config 为 undefined 时使用实例 debugEnabled（false）', () => {
    const logger = new TestLogger({ debug: false })
    expect(logger.callShouldShowDebug(undefined)).toBe(false)
  })

  it('config 为 undefined 时使用实例 debugEnabled（true）', () => {
    const logger = new TestLogger({ debug: true })
    expect(logger.callShouldShowDebug(undefined)).toBe(true)
  })

  it('config.debug:true 覆盖实例的 false', () => {
    const logger = new TestLogger({ debug: false })
    expect(logger.callShouldShowDebug({ debug: true })).toBe(true)
  })

  it('config.debug:false 覆盖实例的 true', () => {
    const logger = new TestLogger({ debug: true })
    expect(logger.callShouldShowDebug({ debug: false })).toBe(false)
  })

  it('config 不含 debug 字段时回退到实例 debugEnabled', () => {
    const logger = new TestLogger({ debug: true })
    expect(logger.callShouldShowDebug({ prefix: 'X' })).toBe(true)
  })
})
