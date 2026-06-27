import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { NodeLogger } from '@/node'

/** ANSI ESC 转义起始字符 */
const ESC = String.fromCharCode(27)

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'jl-log-'))
  // 用例会真打日志（含故意的 error），静默控制台避免污染测试输出
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  vi.restoreAllMocks()
  await rm(dir, { recursive: true, force: true })
})

describe('NodeLogger 文件日志（rotating-file-stream）', () => {
  it('默认以 jsonl 写入，每行一个 JSON 记录', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ file: { path: file } })

    logger.info('hello')
    logger.success('done')
    logger.error('boom', new Error('bad thing'))
    await logger.close()

    const lines = (await readFile(file, 'utf8')).trim().split('\n')
    expect(lines).toHaveLength(3)

    const recs = lines.map(l => JSON.parse(l))
    expect(recs[0]).toMatchObject({ level: 'info', msg: 'hello' })
    expect(recs[1]).toMatchObject({ level: 'success', msg: 'done' })
    expect(recs[2]).toMatchObject({ level: 'error', msg: 'boom' })
    expect(typeof recs[0].time).toBe('string')
    // 错误堆栈写入 detail 字段
    expect(String(recs[2].detail)).toContain('bad thing')
  })

  it('text 格式写入带时间戳、级别与前缀的纯文本行', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ prefix: 'App', file: { path: file, format: 'text' } })

    logger.warn('careful')
    await logger.close()

    const content = await readFile(file, 'utf8')
    expect(content).toMatch(/^\d{4}-\d{2}-\d{2}T.*WARN\s+\[App\] careful/m)
  })

  it('落盘内容不含 ANSI 颜色码（终端彩色不污染文件）', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ file: { path: file, format: 'text' } })

    logger.info('colored?')
    await logger.close()

    const content = await readFile(file, 'utf8')
    expect(content).not.toContain(ESC)
    expect(content).toContain('colored?')
  })

  it('debug 仅在开启时写入文件', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ file: { path: file } })

    logger.debug('hidden')
    logger.debug('shown', { debug: true })
    await logger.close()

    const lines = (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean)
    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0])).toMatchObject({ level: 'debug', msg: 'shown' })
  })

  it('needLog() 为 false 时不写文件', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ needLog: () => false, file: { path: file } })

    logger.info('nope')
    logger.error('nope', new Error('x'))
    await logger.close()

    const content = existsSync(file) ? await readFile(file, 'utf8') : ''
    expect(content.trim()).toBe('')
  })

  it('按大小轮转：超过阈值会生成额外的轮转文件', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ file: { path: file, size: '200B' } })

    for (let i = 0; i < 50; i++) {
      logger.info(`line ${i} ${'x'.repeat(20)}`)
    }
    await logger.close()

    const files = await readdir(dir)
    // 活动文件 + 至少一个轮转后的文件
    expect(files.length).toBeGreaterThan(1)
  })

  it('未配置 file 时不创建任何文件，close() 安全', async () => {
    const logger = new NodeLogger({ prefix: 'NoFile' })
    logger.info('console only')
    await expect(logger.close()).resolves.toBeUndefined()
    expect(await readdir(dir)).toHaveLength(0)
  })

  it('autoClose 默认监听 beforeExit，close() 后移除监听', async () => {
    const before = process.listenerCount('beforeExit')
    const logger = new NodeLogger({ file: { path: join(dir, 'a.log') } })
    expect(process.listenerCount('beforeExit')).toBe(before + 1)
    await logger.close()
    expect(process.listenerCount('beforeExit')).toBe(before)
  })

  it('autoClose:false 时不注册 beforeExit 监听', async () => {
    const before = process.listenerCount('beforeExit')
    const logger = new NodeLogger({ file: { path: join(dir, 'a.log'), autoClose: false } })
    expect(process.listenerCount('beforeExit')).toBe(before)
    await logger.close()
  })

  it('close() 幂等，可安全多次调用', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ file: { path: file } })

    logger.info('once')
    await Promise.all([logger.close(), logger.close(), logger.close()])

    const lines = (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean)
    expect(lines).toHaveLength(1)
  })

  it('handleSignals 默认 false，不注册信号监听', async () => {
    const sigint = process.listenerCount('SIGINT')
    const sigterm = process.listenerCount('SIGTERM')

    const logger = new NodeLogger({ file: { path: join(dir, 'a.log') } })
    expect(process.listenerCount('SIGINT')).toBe(sigint)
    expect(process.listenerCount('SIGTERM')).toBe(sigterm)

    await logger.close()
  })

  it('handleSignals:true 注册 SIGINT/SIGTERM，close() 后移除', async () => {
    const sigint = process.listenerCount('SIGINT')
    const sigterm = process.listenerCount('SIGTERM')

    const logger = new NodeLogger({ file: { path: join(dir, 'a.log'), handleSignals: true } })
    expect(process.listenerCount('SIGINT')).toBe(sigint + 1)
    expect(process.listenerCount('SIGTERM')).toBe(sigterm + 1)

    await logger.close()
    expect(process.listenerCount('SIGINT')).toBe(sigint)
    expect(process.listenerCount('SIGTERM')).toBe(sigterm)
  })

  it('format 传函数时完全自定义每行内容，时间从 record.date 自取（自动补换行）', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({
      file: {
        path: file,
        format: r => `${r.date instanceof Date ? 'T' : '?'} ${r.level.toUpperCase()} | ${r.message}`,
      },
    })

    logger.info('hi')
    logger.warn('yo')
    await logger.close()

    expect(await readFile(file, 'utf8')).toBe('T INFO | hi\nT WARN | yo\n')
  })

  it('formatTime 可把时间格式化为东八区', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({
      file: {
        path: file,
        formatTime: d => new Date(d.getTime() + 8 * 3600_000).toISOString().replace('Z', '+08:00'),
      },
    })

    logger.info('tz')
    await logger.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(rec.time).toMatch(/\+08:00$/)
  })

  it('formatTime 可返回 epoch 数字，jsonl 的 time 为数字', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({
      file: { path: file, formatTime: d => d.getTime() },
    })

    logger.info('epoch')
    await logger.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(typeof rec.time).toBe('number')
    expect(rec.time).toBeGreaterThan(1_700_000_000_000)
  })

  it('meta 字段并入 jsonl 顶层，且不覆盖内置 time/level/msg', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({
      file: { path: file, meta: { sessionId: 'abc', level: 'HACK' } },
    })

    logger.info('with meta')
    await logger.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(rec.sessionId).toBe('abc')
    expect(rec.msg).toBe('with meta')
    expect(rec.level).toBe('info') // 内置字段优先，meta 不能覆盖
  })

  it('meta 传函数时每条日志求值一次（适合动态值）', async () => {
    const file = join(dir, 'app.log')
    let n = 0
    const logger = new NodeLogger({
      file: { path: file, meta: () => ({ seq: ++n }) },
    })

    logger.info('a')
    logger.info('b')
    await logger.close()

    const recs = (await readFile(file, 'utf8')).trim().split('\n').map(l => JSON.parse(l))
    expect(recs.map(r => r.seq)).toEqual([1, 2])
  })

  it('按调用传入的 meta 与构造期 meta 合并，且本条优先', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({
      file: { path: file, meta: () => ({ route: '/home', sessionId: 's1' }) },
    })

    logger.info('purchase', { meta: { sku: 'A-1', route: '/checkout' } })
    await logger.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(rec.sessionId).toBe('s1')      // 来自构造期环境字段
    expect(rec.sku).toBe('A-1')           // 来自本条
    expect(rec.route).toBe('/checkout')   // 同名时本条优先
    expect(rec.msg).toBe('purchase')
  })

  it('error 的按调用 meta 与 detail 同时落盘', async () => {
    const file = join(dir, 'app.log')
    const logger = new NodeLogger({ file: { path: file } })

    logger.error('failed', new Error('oops'), { meta: { orderId: 'o-9' } })
    await logger.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(rec.orderId).toBe('o-9')
    expect(String(rec.detail)).toContain('oops')
  })
})
