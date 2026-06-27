# 更新日志

## [Unreleased]

## [2.1.0] - 2026-06-27

### Added

- **文件日志**：`NodeLogger` 新增 `file` 配置，基于可选依赖 `rotating-file-stream` 将日志写入本地文件，支持按大小 / 时间轮转、gzip 压缩与保留清理；落盘为去除 ANSI 颜色的 jsonl / text；提供 `autoClose`（默认开启，进程自然退出自动刷新）与 `handleSignals` 选项
- **文件日志高度自定义**：`file.format` 支持传函数完全掌控每行内容（拿到 `record.date` 自行格式化时间）；新增 `file.formatTime`（格式化内置格式的 time 字段，可返回字符串或 epoch 数字，如东八区或数字时间戳）与 `file.meta`（往 jsonl 顶层并入 `sessionId` 等环境字段，支持函数动态求值，且不覆盖内置 `time`/`level`/`msg`）；新增 `FileLogRecord`、`FileLogFormatFn` 类型导出
- **按调用传入 meta**：`MethodConfig` 新增 `meta`，可给单条日志挂结构化上下文（如 `logger.info('purchase', { meta: { orderId } })`），与构造期 `file.meta`（环境默认）合并、同名时本条优先；Electron 渲染进程的 meta 经 IPC 一并转发落盘
- **Electron 全链路日志**：新增 `exposeLogBridge`、`forwardToMain`（浏览器入口）与 `listenElectronLogs`、`NodeLogger.writeRecord`（Node 入口），把渲染进程日志经 IPC 转发到主进程统一落盘；全程不引入 `electron`，`ipcMain` / `ipcRenderer` / `contextBridge` 由调用方注入
- **`onLog` 订阅钩子**：`BaseLogOpts` 新增 `onLog`，每条日志产生时回调一条结构化记录（受 `needLog` 控制），可用于 IPC 转发或接入 *WebSocket* / *Sentry* 等
- 浏览器端暴露 `debugColor` 配置（此前 debug 颜色为硬编码）
- 引入基于 *Vitest* + *jsdom* 的测试套件，覆盖 `BrowserLogger`、`NodeLogger`、`TerminalColor`、`BaseLogger`、`FileTransport`、Electron 日志桥以及工具函数（utils）

### Changed

- 完善 `package.json` 元信息：新增 `repository`、`bugs`、`engines`、`sideEffects`、`keywords` 以及测试相关 `scripts`
- 重写中英双语 *README*（`README.md` / `README.en.md`）

## [2.0.0] - 2025-10-16

主版本升级，包含相对 *1.0.0* 的重大不兼容变更（**BREAKING**）

### Changed

- 重构日志系统，实现自包含的 *ANSI* 颜色方案
- 更新 *README* 与测试以适配新的颜色实现

### Removed

- 移除对 `kleur` 的依赖，转为零依赖实现

## [1.0.0] - 2025-08-07

首个稳定版本，包含相对 *0.x* 的接口重设计（**BREAKING**）

### Added

- 支持 *Node* 进程终止（terminate）能力

### Changed

- 重新设计公共接口（**BREAKING**）

## [0.1.0] - 2024-05-24

初始版本发布

### Added

- 浏览器与 *Node.js* 的彩色日志输出
- 表格样式渲染
- 对象自动解析

### Fixed

- 修复表格样式问题
