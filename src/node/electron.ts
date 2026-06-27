/**
 * Electron 主进程日志接收（Node 入口）
 *
 * 监听渲染进程经 IPC 发来的日志记录，交给 {@link NodeLogger} 统一落盘
 * 与渲染侧一样**不引入 electron**——`ipcMain` 由调用方注入，保持零依赖与可单测
 */

import { JL_LOG_IPC_CHANNEL } from '../shared/ipc'
import type { LogRecordPayload } from '../shared/ipc'
import type { NodeLogger } from './NodeLogger'

/**
 * 在**主进程**中调用，监听渲染进程转发来的日志并写入 `logger` 的文件
 *
 * @param ipcMain electron 的 `ipcMain`
 * @param logger 已配置 `file` 的 {@link NodeLogger} 实例
 * @returns 取消监听的函数
 *
 * @example
 * ```ts
 * import { ipcMain } from 'electron'
 * import { NodeLogger, listenElectronLogs } from '@jl-org/log/node'
 *
 * const logger = new NodeLogger({ file: { path: 'logs/app.log' } })
 * listenElectronLogs(ipcMain, logger)
 *
 * // 退出前刷新关闭（或依赖 file.autoClose 的 beforeExit）
 * app.on('before-quit', () => { void logger.close() })
 * ```
 */
export function listenElectronLogs(
  ipcMain: ElectronIpcMain,
  logger: NodeLogger,
): () => void {
  const handler = (_event: unknown, record: LogRecordPayload): void => {
    if (isLogRecord(record)) {
      logger.writeRecord(record)
    }
  }

  ipcMain.on(JL_LOG_IPC_CHANNEL, handler)

  return () => ipcMain.removeListener(JL_LOG_IPC_CHANNEL, handler)
}

/** 校验跨进程传来的负载，避免渲染进程发来脏数据写穿文件 */
function isLogRecord(value: unknown): value is LogRecordPayload {
  return (
    typeof value === 'object'
    && value !== null
    && typeof (value as LogRecordPayload).level === 'string'
    && typeof (value as LogRecordPayload).message === 'string'
    && typeof (value as LogRecordPayload).time === 'string'
  )
}

/** electron `ipcMain` 的最小结构（避免对 electron 产生类型硬依赖） */
interface ElectronIpcMain {
  on(channel: string, listener: (event: any, ...args: any[]) => void): unknown
  removeListener(channel: string, listener: (...args: any[]) => void): unknown
}
