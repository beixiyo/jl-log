# 更新日志

本项目所有值得关注的变更都会记录在此文件中。

本文件格式遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
并且本项目遵循 [语义化版本（SemVer）](https://semver.org/lang/zh-CN/)。

## [Unreleased]

### Added

- 引入基于 *Vitest* + *jsdom* 的测试套件，覆盖 `BrowserLogger`、`NodeLogger`、`TerminalColor`、`BaseLogger` 以及工具函数（utils）

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
