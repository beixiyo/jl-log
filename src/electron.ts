/**
 * Electron 渲染侧日志桥接（浏览器入口）
 *
 * 把渲染进程的日志经 IPC 转发到主进程统一落盘，全程**不引入 electron**——
 * `contextBridge` / `ipcRenderer` 由调用方注入，因此既不增加依赖，也兼容
 * `contextIsolation` 开/关两种模式
 *
 * 三步接线：
 * 1. preload 里调用 {@link exposeLogBridge}，把发送通道安全暴露到渲染进程
 * 2. 渲染进程用 `new BrowserLogger({ onLog: forwardToMain })`
 * 3. 主进程用 `listenElectronLogs(ipcMain, logger)` 接收并落盘（见 `@jl-org/log/node`）
 */

import { JL_LOG_BRIDGE_KEY, JL_LOG_IPC_CHANNEL } from './shared/ipc'
import type { JlLogBridge, LogRecordPayload } from './shared/ipc'

/**
 * 在 **preload 脚本**中调用，把日志发送桥安全暴露到渲染进程的 `window` 上
 *
 * @param contextBridge electron 的 `contextBridge`
 * @param ipcRenderer electron 的 `ipcRenderer`
 *
 * @example
 * ```ts
 * // preload.ts
 * import { contextBridge, ipcRenderer } from 'electron'
 * import { exposeLogBridge } from '@jl-org/log'
 *
 * exposeLogBridge(contextBridge, ipcRenderer)
 * ```
 */
export function exposeLogBridge(
  contextBridge: ElectronContextBridge,
  ipcRenderer: ElectronIpcRenderer,
): void {
  const bridge: JlLogBridge = {
    send: record => ipcRenderer.send(JL_LOG_IPC_CHANNEL, record),
  }

  contextBridge.exposeInMainWorld(JL_LOG_BRIDGE_KEY, bridge)
}

/**
 * 渲染进程的 `onLog` 处理器：把一条日志记录经 preload 暴露的桥发往主进程
 *
 * 桥不存在（未注入 preload / 非 Electron 环境）时静默跳过，便于同一份代码在
 * 浏览器与 Electron 中复用
 *
 * @example
 * ```ts
 * import { BrowserLogger, forwardToMain } from '@jl-org/log'
 *
 * const logger = new BrowserLogger({ prefix: 'UserPage', onLog: forwardToMain })
 * logger.info('clicked submit')   // 控制台打印 + 转发到主进程落盘
 * ```
 */
export function forwardToMain(record: LogRecordPayload): void {
  const bridge = (globalThis as any)?.[JL_LOG_BRIDGE_KEY] as JlLogBridge | undefined
  bridge?.send(record)
}

/** electron `contextBridge` 的最小结构（避免对 electron 产生类型硬依赖） */
interface ElectronContextBridge {
  exposeInMainWorld(apiKey: string, api: unknown): void
}

/** electron `ipcRenderer` 的最小结构 */
interface ElectronIpcRenderer {
  send(channel: string, ...args: any[]): void
}
