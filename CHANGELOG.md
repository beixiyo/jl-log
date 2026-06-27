# 更新日志

本项目所有值得关注的变更都会记录在此文件中。

本文件格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
并且本项目遵循 [语义化版本（SemVer）](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- **文件日志**：`NodeLogger` 新增 `file` 配置，基于可选依赖 `rotating-file-stream` 将日志写入本地文件，支持按大小 / 时间轮转、gzip 压缩与保留清理；落盘为去除 ANSI 颜色的 NDJSON / text；提供 `autoClose`（默认开启，进程自然退出自动刷新）与 `handleSignals` 选项
- **Electron 全链路日志**：新增 `exposeLogBridge`、`forwardToMain`（浏览器入口）与 `listenElectronLogs`、`NodeLogger.writeRecord`（Node 入口），把渲染进程日志经 IPC 转发到主进程统一落盘；全程不引入 `electron`，`ipcMain` / `ipcRenderer` / `contextBridge` 由调用方注入
- **`onLog` 订阅钩子**：`BaseLogOpts` 新增 `onLog`，每条日志产生时回调一条结构化记录（受 `needLog` 控制），可用于 IPC 转发或接入 *WebSocket* / *Sentry* 等
- 浏览器端暴露 `debugColor` 配置（此前 debug 颜色为硬编码）
- 引入基于 *Vitest* + *jsdom* 的测试套件，覆盖 `BrowserLogger`、`NodeLogger`、`TerminalColor`、`BaseLogger`、`FileTransport`、Electron 日志桥以及工具函数（utils）

### Changed

- 完善 `package.json` 元信息：新增 `repository`、`bugs`、`engines`、`sideEffects`、`keywords` 以及测试相关 `scripts`
- 重写中英双语 *README*（`README.md` / `README.en.md`）

## [2.0.0] - 2025-10-16

主版本升级，包含相对 *1.0.0* 的重大不兼容变更（**BREAKING**）。

### Changed

- 重构日志系统，实现自包含的 *ANSI* 颜色方案
- 更新 *README* 与测试以适配新的颜色实现

### Removed

- 移除对 `kleur` 的依赖，转为零依赖实现

## [1.0.0] - 2025-08-07

首个稳定版本，包含相对 *0.x* 的接口重设计（**BREAKING**）。

### Added

- 支持 *Node* 进程终止（terminate）能力

### Changed

- 重新设计公共接口（**BREAKING**）

## [0.1.0] - 2024-05-24

初始版本发布。

### Added

- 浏览器与 *Node.js* 的彩色日志输出
- 表格样式渲染
- 对象自动解析

### Fixed

- 修复表格样式问题
