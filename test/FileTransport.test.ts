import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { existsSync } from 'node:fs'
import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { FileTransport, NodeLogger } from '@/node'

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
  it('FileTransport 无写入时 close 不创建文件', async () => {
    const file = join(dir, 'app.log')
    const transport = new FileTransport({ path: file })

    await transport.close()

    expect(existsSync(file)).toBe(false)
  })

  it('FileTransport 实现标准 write(record) 接口', async () => {
    const file = join(dir, 'app.log')
    const transport = new FileTransport({ path: file })

    transport.write({
      level: 'info',
      message: 'direct',
      time: '2026-06-27T03:00:00.000Z',
      meta: { source: 'custom' },
    })
    await transport.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(rec).toMatchObject({
      time: '2026-06-27T03:00:00.000Z',
      level: 'info',
      msg: 'direct',
      source: 'custom',
    })
  })

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

  it('就绪前缓冲封顶丢最旧，就绪回放时补一条丢弃 warn', async () => {
    const file = join(dir, 'app.log')
    const transport = new FileTransport({ path: file })

    // init 是异步的（动态 import），同步连写 5500 行全部先进缓冲，触发封顶
    for (let i = 0; i < 5500; i++) {
      transport.write('info', `line ${i}`)
    }
    await transport.close()

    const lines = (await readFile(file, 'utf8')).trim().split('\n')
    // 5000 行保留 + 1 条丢弃 warn
    expect(lines).toHaveLength(5001)

    const recs = lines.map(l => JSON.parse(l))
    expect(recs[0].level).toBe('warn')
    expect(recs[0].msg).toContain('Dropped 500')
    // 丢最旧：保留的是最后 5000 行
    expect(recs[1].msg).toBe('line 500')
    expect(recs[recs.length - 1].msg).toBe('line 5499')
  })

  it('maxBufferedLines 可配：就绪前缓冲按自定义上限封顶', async () => {
    const file = join(dir, 'app.log')
    const transport = new FileTransport({ path: file, maxBufferedLines: 10 })

    for (let i = 0; i < 15; i++) {
      transport.write('info', `line ${i}`)
    }
    await transport.close()

    const lines = (await readFile(file, 'utf8')).trim().split('\n')
    // 10 行保留 + 1 条丢弃 warn
    expect(lines).toHaveLength(11)

    const recs = lines.map(l => JSON.parse(l))
    expect(recs[0].msg).toContain('Dropped 5')
    // 丢最旧：保留的是最后 10 行
    expect(recs[1].msg).toBe('line 5')
    expect(recs[recs.length - 1].msg).toBe('line 14')
  })

  it('maxOverflowLines 可配：背压溢出队列按自定义上限封顶', async () => {
    const file = join(dir, 'app.log')
    const transport = new FileTransport({ path: file, maxOverflowLines: 5 })

    // 白盒：注入假流模拟背压（同上，返回 false 时数据仍被流内部缓冲）
    const written: string[] = []
    let accept = true
    const fake = {
      write(chunk: string) {
        written.push(chunk)
        return accept
      },
      end(cb?: () => void) { cb?.() },
      on() { return this },
    }
    ;(transport as any).stream = fake
    ;(transport as any).ready = Promise.resolve()

    // 背压：writable 置 false，后续进溢出队列
    accept = false
    transport.write('info', 'trigger backpressure')

    for (let i = 0; i < 7; i++) {
      transport.write('info', `overflow ${i}`)
    }
    expect((transport as any).overflow).toHaveLength(5)
    expect((transport as any).droppedOverflowLines).toBe(2)

    // drain 恢复：warn + 按序冲刷
    accept = true
    ;(transport as any).flushOverflow(fake)
    expect((transport as any).overflow).toHaveLength(0)
    expect(written[written.length - 1]).toContain('overflow 6')
  })

  it('建流抛错（非法 size）后清空积压并停止缓冲', async () => {
    const file = join(dir, 'app.log')
    // rfs 对非法 size 同步抛错，触发 init 失败路径
    const transport = new FileTransport({ path: file, size: 'not-a-size' })

    transport.write('info', 'first')
    await (transport as any).ready

    // 失败后继续写入不再积压
    for (let i = 0; i < 100; i++) {
      transport.write('info', `after ${i}`)
    }
    expect((transport as any).initFailed).toBe(true)
    expect((transport as any).buffer).toHaveLength(0)

    await transport.close()
    expect(existsSync(file)).toBe(false)
  })

  it('write() 返回 false 时切有界溢出队列，drain 后带丢弃 warn 冲刷恢复', async () => {
    const file = join(dir, 'app.log')
    const transport = new FileTransport({ path: file })

    // 白盒：注入假流模拟背压（返回 false 时数据仍被流内部缓冲，故 written 始终记录）
    const written: string[] = []
    let accept = true
    const fake = {
      write(chunk: string) {
        written.push(chunk)
        return accept
      },
      end(cb?: () => void) { cb?.() },
      on() { return this },
    }
    ;(transport as any).stream = fake
    ;(transport as any).ready = Promise.resolve()

    transport.write('info', 'direct')
    expect(written).toHaveLength(1)

    // 背压：本条被流缓冲接收，但 writable 置 false
    accept = false
    transport.write('info', 'buffered by stream')
    expect(written).toHaveLength(2)

    // 后续写入进溢出队列，写满上限后再多写 2 行触发丢最旧
    for (let i = 0; i < 5002; i++) {
      transport.write('info', `overflow ${i}`)
    }
    expect(written).toHaveLength(2)
    expect((transport as any).overflow).toHaveLength(5000)
    expect((transport as any).droppedOverflowLines).toBe(2)

    // drain 恢复：先补丢弃 warn，再按序冲刷，之后恢复直写
    accept = true
    ;(transport as any).flushOverflow(fake)
    expect((transport as any).overflow).toHaveLength(0)
    expect(written[2]).toContain('Dropped 2')
    expect(written[3]).toContain('overflow 2')
    expect(written[written.length - 1]).toContain('overflow 5001')

    transport.write('info', 'direct again')
    expect(written[written.length - 1]).toContain('direct again')
  })
})
