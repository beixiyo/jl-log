import { afterEach, beforeEach, describe, expect, it } from 'vitest'
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
})

afterEach(async () => {
  await rm(dir, { recursive: true, force: true })
})

describe('NodeLogger 文件日志（rotating-file-stream）', () => {
  it('默认以 NDJSON 写入，每行一个 JSON 记录', async () => {
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
})
