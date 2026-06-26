import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * 颜色支持自动检测测试
 *
 * `terminalColor` 单例在「模块加载时」于构造函数里运行一次 `detectColorSupport()`，
 * 因此这里通过 `vi.resetModules()` + 动态 `import` 让每个用例都拿到一个「全新单例」，
 * 其构造函数会读取我们临时打桩的 `process.env` / `process.platform` / `process.stdout.isTTY`。
 */

/** detectColorSupport 会读取的全部环境变量 —— 基线统一清空，逐用例按需设置 */
const COLOR_ENV_KEYS = [
  'NO_COLOR',
  'FORCE_COLOR',
  'TERM',
  'COLORTERM',
  'TERM_PROGRAM',
  'ConEmuANSI',
  'WT_SESSION',
  'PSVersion',
  'OS',
  'PSModulePath',
]

let platformDescriptor: PropertyDescriptor | undefined
let isTTYDescriptor: PropertyDescriptor | undefined

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true })
}

function setIsTTY(isTTY: boolean) {
  Object.defineProperty(process.stdout, 'isTTY', { value: isTTY, configurable: true })
}

/** 拿到一个用当前（被打桩的）环境重新检测过颜色支持的全新单例 */
async function freshIsEnabled(): Promise<boolean> {
  vi.resetModules()
  const mod = await import('@/node/TerminalColor')
  return mod.terminalColor.isEnabled()
}

describe('TerminalColor 颜色支持自动检测', () => {
  beforeEach(() => {
    platformDescriptor = Object.getOwnPropertyDescriptor(process, 'platform')
    isTTYDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY')

    /** 基线：清空所有相关环境变量，平台 linux，非 TTY —— 默认应当「不支持颜色」 */
    for (const key of COLOR_ENV_KEYS) {
      vi.stubEnv(key, '')
    }
    setPlatform('linux')
    setIsTTY(false)
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    if (platformDescriptor)
      Object.defineProperty(process, 'platform', platformDescriptor)
    if (isTTYDescriptor)
      Object.defineProperty(process.stdout, 'isTTY', isTTYDescriptor)
    else
      delete (process.stdout as any).isTTY
    vi.resetModules()
  })

  it('FORCE_COLOR=1 时强制启用', async () => {
    vi.stubEnv('FORCE_COLOR', '1')
    expect(await freshIsEnabled()).toBe(true)
  })

  it('FORCE_COLOR=true 时强制启用', async () => {
    vi.stubEnv('FORCE_COLOR', 'true')
    expect(await freshIsEnabled()).toBe(true)
  })

  it('FORCE_COLOR=0 时强制禁用（即使 TERM 支持颜色）', async () => {
    vi.stubEnv('FORCE_COLOR', '0')
    vi.stubEnv('TERM', 'xterm-256color')
    setIsTTY(true)
    expect(await freshIsEnabled()).toBe(false)
  })

  it('NO_COLOR=1 时禁用', async () => {
    vi.stubEnv('NO_COLOR', '1')
    vi.stubEnv('TERM', 'xterm-256color')
    expect(await freshIsEnabled()).toBe(false)
  })

  it('TERM 含 256/color/truecolor 时启用', async () => {
    vi.stubEnv('TERM', 'xterm-256color')
    expect(await freshIsEnabled()).toBe(true)
  })

  it('是 TTY 时启用', async () => {
    setIsTTY(true)
    expect(await freshIsEnabled()).toBe(true)
  })

  it('COLORTERM 等终端环境变量存在时启用', async () => {
    vi.stubEnv('COLORTERM', 'truecolor')
    expect(await freshIsEnabled()).toBe(true)
  })

  it('环境干净、非 TTY、非 Windows 时默认禁用', async () => {
    expect(await freshIsEnabled()).toBe(false)
  })

  it('Windows + WT_SESSION（Windows Terminal）时启用', async () => {
    setPlatform('win32')
    vi.stubEnv('WT_SESSION', 'some-guid')
    expect(await freshIsEnabled()).toBe(true)
  })

  it('Windows + ConEmuANSI=ON 时启用', async () => {
    setPlatform('win32')
    vi.stubEnv('ConEmuANSI', 'ON')
    expect(await freshIsEnabled()).toBe(true)
  })
})
