import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EventEmitter } from 'node:events'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { BrowserLogger, JL_LOG_BRIDGE_KEY, forwardToMain } from '@/index'
import type { LogRecordPayload } from '@/index'
import { NodeLogger, listenElectronLogs } from '@/node'

/**
 * 用一条 EventEmitter 总线模拟 Electron 的 IPC：
 * ipcRenderer.send → ipcMain.on 的处理器，并提供 contextBridge 注入
 */
function makeElectronMock() {
  const bus = new EventEmitter()

  const ipcMain = {
    on: (ch: string, fn: (...args: any[]) => void) => bus.on(ch, fn),
    removeListener: (ch: string, fn: (...args: any[]) => void) => bus.removeListener(ch, fn),
  }

  const ipcRenderer = {
    send: (ch: string, ...args: any[]) => bus.emit(ch, { senderId: 1 }, ...args),
  }

  const contextBridge = {
    exposeInMainWorld: (key: string, api: unknown) => {
      ;(globalThis as any)[key] = api
    },
  }

  return { bus, ipcMain, ipcRenderer, contextBridge }
}

let dir: string

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'jl-log-electron-'))
  // 渲染端会真打日志（含故意的 error），静默控制台避免污染测试输出
  vi.spyOn(console, 'log').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(async () => {
  vi.restoreAllMocks()
  delete (globalThis as any)[JL_LOG_BRIDGE_KEY]
  await rm(dir, { recursive: true, force: true })
})

describe('Electron 渲染进程 → 主进程日志桥', () => {
  it('渲染端日志经 IPC 落到主进程文件，时间戳保留产生端', async () => {
    const { ipcMain, ipcRenderer, contextBridge } = makeElectronMock()

    /** 主进程：建 logger + 监听 */
    const file = join(dir, 'app.log')
    const main = new NodeLogger({ file: { path: file } })
    listenElectronLogs(ipcMain, main)

    /** preload：暴露桥 */
    const { exposeLogBridge } = await import('@/index')
    exposeLogBridge(contextBridge, ipcRenderer)

    /** 渲染进程：记录发送端 record 以便比对，同时转发 */
    const sent: LogRecordPayload[] = []
    const renderer = new BrowserLogger({
      prefix: 'UserPage',
      onLog: (r) => {
        sent.push(r)
        forwardToMain(r)
      },
    })

    renderer.info('clicked submit')
    renderer.error('request failed', new Error('timeout'))

    await main.close()

    const lines = (await readFile(file, 'utf8')).trim().split('\n')
    expect(lines).toHaveLength(2)

    const recs = lines.map(l => JSON.parse(l))
    expect(recs[0]).toMatchObject({ level: 'info', msg: '[UserPage] clicked submit' })
    expect(recs[1]).toMatchObject({ level: 'error', msg: '[UserPage] request failed' })
    expect(String(recs[1].detail)).toContain('timeout')

    // 落盘时间应等于渲染端产生时间，而非主进程写入时间
    expect(recs[0].time).toBe(sent[0].time)
    expect(recs[1].time).toBe(sent[1].time)
  })

  it('渲染端按调用传入的 meta 随 IPC 转发并落盘', async () => {
    const { ipcMain, ipcRenderer, contextBridge } = makeElectronMock()

    const file = join(dir, 'app.log')
    const main = new NodeLogger({ file: { path: file } })
    listenElectronLogs(ipcMain, main)

    const { exposeLogBridge } = await import('@/index')
    exposeLogBridge(contextBridge, ipcRenderer)
    const renderer = new BrowserLogger({ prefix: 'UserPage', onLog: forwardToMain })

    renderer.info('purchase', { meta: { sku: 'A-1', orderId: 'o-9' } })
    await main.close()

    const rec = JSON.parse((await readFile(file, 'utf8')).trim())
    expect(rec).toMatchObject({ level: 'info', msg: '[UserPage] purchase', sku: 'A-1', orderId: 'o-9' })
  })

  it('forwardToMain 在无桥（非 Electron / 未注入 preload）时静默跳过', () => {
    const record: LogRecordPayload = {
      level: 'info',
      message: 'no bridge here',
      time: new Date().toISOString(),
    }
    expect(() => forwardToMain(record)).not.toThrow()
  })

  it('listenElectronLogs 返回的取消函数能停止后续写入', async () => {
    const { ipcMain, ipcRenderer, contextBridge } = makeElectronMock()

    const file = join(dir, 'app.log')
    const main = new NodeLogger({ file: { path: file } })
    const stop = listenElectronLogs(ipcMain, main)

    const { exposeLogBridge } = await import('@/index')
    exposeLogBridge(contextBridge, ipcRenderer)
    const renderer = new BrowserLogger({ onLog: forwardToMain })

    renderer.info('before stop')
    stop()
    renderer.info('after stop')

    await main.close()

    const lines = (await readFile(file, 'utf8')).trim().split('\n').filter(Boolean)
    expect(lines).toHaveLength(1)
    expect(JSON.parse(lines[0])).toMatchObject({ msg: 'before stop' })
  })

  it('丢弃结构非法的负载，不写穿文件', async () => {
    const { bus, ipcMain } = makeElectronMock()

    const file = join(dir, 'app.log')
    const main = new NodeLogger({ file: { path: file } })
    listenElectronLogs(ipcMain, main)

    // 直接往通道里发脏数据
    bus.emit('__JL_LOG__', {}, null)
    bus.emit('__JL_LOG__', {}, { level: 'info' }) // 缺 message / time
    bus.emit('__JL_LOG__', {}, 'not an object')

    await main.close()

    const content = await readFile(file, 'utf8').catch(() => '')
    expect(content.trim()).toBe('')
  })

  it('渲染端 needLog 为 false 时不转发', async () => {
    const { ipcMain, ipcRenderer, contextBridge } = makeElectronMock()

    const file = join(dir, 'app.log')
    const main = new NodeLogger({ file: { path: file } })
    listenElectronLogs(ipcMain, main)

    const { exposeLogBridge } = await import('@/index')
    exposeLogBridge(contextBridge, ipcRenderer)
    const renderer = new BrowserLogger({ needLog: () => false, onLog: forwardToMain })

    renderer.info('suppressed')
    renderer.error('suppressed', new Error('x'))

    await main.close()

    const content = await readFile(file, 'utf8').catch(() => '')
    expect(content.trim()).toBe('')
  })
})
