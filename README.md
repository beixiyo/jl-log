# 🎨 @jl-org/log

<div align="center">

**一个超级美丽的跨平台日志工具** ✨

*同时支持浏览器和 Node.js 环境的彩色日志输出 · 零依赖 · 完整 TypeScript 类型*

[![NPM Version](https://img.shields.io/npm/v/@jl-org/log.svg)](https://www.npmjs.com/package/@jl-org/log)
[![License](https://img.shields.io/npm/l/@jl-org/log.svg)](https://github.com/beixiyo/jl-log/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dy/@jl-org/log.svg)](https://www.npmjs.com/package/@jl-org/log)

[English](./README.en.md) | **中文**

</div>

## ✨ 特性亮点

| 特性 | 描述 | 状态 |
|------|------|------|
| 🌐 **跨平台支持** | 浏览器 + Node.js 双环境无缝切换 | ✅ |
| 🎨 **美观输出** | 浏览器 CSS 彩色标签 + Node.js 自实现 ANSI 彩色终端 | ✅ |
| 📦 **零依赖** | 完全无外部依赖，`2.0.0` 起移除 `kleur`，自实现颜色系统 | ✅ |
| 🔧 **统一 API** | 两端共享一致接口，学习成本低 | ✅ |
| 🎯 **TypeScript** | 完整类型定义，颜色字符串都有类型提示 | ✅ |
| ⚡ **高性能** | 轻量实现，按需打印，可被构建工具 tree-shake | ✅ |

## 📸 效果预览

### 🖥️ 浏览器环境效果

![browser-logger](./docAssets/browser.webp)

*浏览器控制台中的彩色标签效果展示*

### 🖥️ Node.js 终端效果

![node-logger](./docAssets/node.webp)

*Node.js 终端中的彩色文字效果展示*

---

## 📦 快速安装

```bash
# 使用 pnpm（推荐）
pnpm add @jl-org/log

# 使用 npm
npm install @jl-org/log

# 使用 yarn
yarn add @jl-org/log
```

> 💡 **Node.js 无需额外依赖**
> 自 `2.0.0` 起，终端颜色由内置的 `TerminalColor` 类（自实现的 ANSI 转义序列）提供，不再依赖 `kleur` 等第三方库，开箱即用

## 🚀 快速开始

### 🌐 浏览器环境

浏览器端从包入口导入 `BrowserLogger`：

```ts
import { BrowserLogger } from '@jl-org/log'

// 创建日志实例
const logger = new BrowserLogger({
  // needLog 让你能用构建标记控制是否打印，便于打包工具在生产环境 tree-shake 掉日志
  // 注意：浏览器中没有 process，请使用构建期标记（如 Vite 的 import.meta.env.DEV）
  needLog: () => import.meta.env?.DEV ?? true,
  prefix: 'MyApp',
  debug: true,
})

// 基础日志
logger.info('🚀 应用启动成功')
logger.success('✅ 数据加载完成')
logger.warn('⚠️ 内存使用率偏高')
logger.error('❌ 网络连接失败')
logger.debug('🐛 调试信息') // 仅在 debug 开启时输出

// 错误对象会被一并打印（含堆栈）
logger.error('请求异常', new Error('500 Internal Server Error'))

// 方法级配置覆盖：临时替换前缀 / 调试开关
logger.info('临时前缀', { prefix: 'TEMP' })
logger.debug('临时启用调试', { debug: true })
logger.error('API 错误', null, { prefix: 'API' })

// 表格展示（浏览器完整支持）
const users = [
  { id: 1, name: '张三', role: '管理员' },
  { id: 2, name: '李四', role: '用户' },
]
logger.table(users)

// 图片展示（浏览器独有）
logger.img('https://example.com/logo.png', 0.5)
```

### 🖥️ Node.js 环境

Node.js 端从 `@jl-org/log/node` 子路径导入 `NodeLogger`：

```ts
import { NodeLogger } from '@jl-org/log/node'

// 创建日志实例
const logger = new NodeLogger({
  prefix: 'MyApp',
  debug: process.env.NODE_ENV === 'development',
})

// 基础日志
logger.info('🚀 服务器启动成功')
logger.success('✅ 数据库连接正常')
logger.warn('⚠️ 内存使用率较高')
logger.error('❌ Redis 连接失败')
logger.debug('🐛 调试信息：用户 ID = 12345')

// 错误对象会输出红色堆栈
logger.error('任务失败', new Error('boom'))

// 方法级配置覆盖
logger.info('临时前缀', { prefix: 'TEMP' })
logger.debug('临时启用调试', { debug: true })
logger.error('API 错误', null, { prefix: 'API' })

// 自定义颜色配置（支持链式调用，详见「颜色字符串参考」）
const colorLogger = new NodeLogger({
  prefix: 'App',
  colors: {
    infoColor: 'cyan.bold', // 青色加粗
    successColor: 'green.underline', // 绿色下划线
    warningColor: 'magenta', // 洋红色
    errorColor: 'red.bold.bgWhite', // 红色加粗白底
    debugColor: 'gray', // 灰色
  },
})
colorLogger.info('自定义样式的信息日志')
colorLogger.success('自定义样式的成功日志')

// 进度条（Node.js 独有），sameLine 默认 true，会在同一行刷新直到完成
for (let i = 0; i <= 100; i += 10) {
  logger.progress({
    message: '处理数据',
    current: i,
    total: 100,
    displayType: 'percentage', // 'percentage' | 'fraction' | 'auto'
  })
  await new Promise(resolve => setTimeout(resolve, 100))
}

// 简单键值对表格（Node.js 专用）
logger.tableSimple({
  应用: 'MyApp',
  版本: 'v2.0.0',
  环境: 'production',
  端口: '3000',
})

// 行内工具
logger.clearLine('正在重试...') // 清除当前行并写入新内容
logger.newLine() // 打印一个空行
logger.log('普通文本（青色输出）') // 不带级别标签的纯文本
```

## 📖 API / 配置参考

### 🌐 BrowserLogger 配置 `LogOpts`

```ts
/** 基础日志配置（两端共享） */
interface BaseLogOpts {
  /** 是否启用调试模式 */
  debug?: boolean
  /** 日志前缀，输出为 `[prefix] ` */
  prefix?: string
  /** 是否需要打印，可根据环境返回布尔值；建议配合构建工具删除生产日志 */
  needLog?: () => boolean
  /**
   * 每条日志产生时的订阅回调，收到一条「已拼好前缀」的结构化记录
   * 典型用途是 Electron 渲染进程经 IPC 转发落盘（可直接传入 `forwardToMain`）；
   * 受 `needLog` 控制，被抑制的日志不会触发
   */
  onLog?: (record: LogRecordPayload) => void
}

/** 浏览器环境日志配置 */
interface LogOpts extends BaseLogOpts {
  /** 信息色，默认 #909399 */
  infoColor?: string
  /** 错误色，默认 #F56C6C */
  errorColor?: string
  /** 警告色，默认 #E6A23C */
  warningColor?: string
  /** 成功色，默认 #67C23A */
  successColor?: string
  /** 调试色，默认 #909399 */
  debugColor?: string
  /** 表格样式 */
  table?: {
    /** 表头 */
    header?: {
      /** 文字颜色，默认 #F2F7FF */
      color?: string
      /** 背景颜色，默认 #1455CC */
      bgc?: string
    }
    /** 数据行 */
    row?: {
      /** 文字颜色，默认 #FFF */
      color?: string
      /** 背景颜色，默认 #656C66 */
      bgc?: string
    }
  }
}
```

### 🖥️ NodeLogger 配置 `NodeLogOpts` / `TerminalColorConfig`

```ts
/** Node.js 日志配置 */
interface NodeLogOpts extends BaseLogOpts {
  /** 颜色配置 */
  colors?: TerminalColorConfig
}

/** 终端颜色配置，值为颜色字符串，支持链式调用 */
interface TerminalColorConfig {
  /** 信息日志颜色，默认 'blue' */
  infoColor?: ColorString
  /** 成功日志颜色，默认 'green' */
  successColor?: ColorString
  /** 警告日志颜色，默认 'yellow' */
  warningColor?: ColorString
  /** 错误日志颜色，默认 'red' */
  errorColor?: ColorString
  /** 调试日志颜色，默认 'gray' */
  debugColor?: ColorString
}

/** 进度条配置 */
interface ProgressConfig {
  /** 进度消息 */
  message: string
  /** 当前进度 */
  current: number
  /** 总进度 */
  total: number
  /** 行内前缀，输出为 `[prefix] ` */
  prefix?: string
  /** 显示类型：百分比 / 分数 / 自动，默认 'auto' */
  displayType?: 'percentage' | 'fraction' | 'auto'
  /** 自定义进度文本，优先级高于 displayType */
  customText?: string
  /** 是否在同一行刷新，默认 true */
  sameLine?: boolean
}
```

### ⚙️ 方法级配置 `MethodConfig`

```ts
/** 方法级配置 - 临时覆盖构造器配置 */
interface MethodConfig {
  /** 临时覆盖前缀（传空字符串可清除前缀） */
  prefix?: string
  /** 临时覆盖调试模式 */
  debug?: boolean
  /**
   * 本条日志的结构化上下文字段，写文件时并入 jsonl 顶层（如 `{ orderId, sku }`）
   * 与文件配置里构造期 `meta`（环境默认）合并，同名时本条优先；
   * Electron 渲染进程的 meta 会随 IPC 转发到主进程落盘
   */
  meta?: Record<string, unknown>
}
```

### 🔧 统一接口 `ILogger`

```ts
/** 两端都实现的基础接口 */
interface ILogger {
  info(message: string, config?: MethodConfig): void
  success(message: string, config?: MethodConfig): void
  warn(message: string, config?: MethodConfig): void
  error(message: string, error?: any, config?: MethodConfig): void
  /** 调试日志（仅 debug 开启时输出） */
  debug?(message: string, config?: MethodConfig): void
  /** 打印图片（仅浏览器环境支持） */
  img?(url: string, scale?: number): void
  /** 打印表格数据 */
  table?<T extends object>(data: T[]): void
}
```

> `NodeLogger` 在 `ILogger` 之外还额外提供 `progress()`、`tableSimple()`、`clearLine()`、`newLine()`、`log()` 等终端专用方法

## 🔍 浏览器 vs Node.js 功能对比

| 功能 | 🌐 浏览器 | 🖥️ Node.js | 📝 说明 |
|------|----------|-----------|--------|
| **基础日志** | ✅ | ✅ | `info` / `success` / `warn` / `error` |
| **调试日志** | ✅ | ✅ | `debug`，可通过 `debug` 配置控制显示 |
| **前缀支持** | ✅ | ✅ | 构造器或方法级均可设置前缀 |
| **方法级配置** | ✅ | ✅ | 临时覆盖 `prefix` / `debug` |
| **错误堆栈** | ✅ | ✅ | 传入 `Error` 对象时一并打印 |
| **表格打印** | ✅ 完整 | ⚠️ 简化 | 浏览器 `table()` 完整支持；Node.js 请用 `tableSimple()` |
| **图片打印** | ✅ | ❌ 警告 | 仅浏览器 `img()` 支持，Node.js 调用会输出警告 |
| **进度条** | ❌ | ✅ | `progress()` 为 Node.js 独有 |
| **彩色输出** | ✅ CSS | ✅ ANSI | 浏览器 CSS 样式 vs Node.js 自实现 ANSI 转义 |

## 🎨 Node.js 颜色字符串参考

`TerminalColorConfig` 中的颜色值为 `ColorString`，可用 `.` 连接多个 token 进行链式组合（如 `'green.bold.underline'`）

| 类别 | 可选值 |
|------|--------|
| **基本颜色** | `black` `red` `green` `yellow` `blue` `magenta` `cyan` `white` `gray` `grey` |
| **背景颜色** | `bgBlack` `bgRed` `bgGreen` `bgYellow` `bgBlue` `bgMagenta` `bgCyan` `bgWhite` |
| **文本修饰** | `bold` `dim` `italic` `underline` `inverse` `hidden` `strikethrough` |

```ts
// 链式组合示例
const logger = new NodeLogger({
  colors: {
    infoColor: 'cyan.bold', // 青色 + 加粗
    successColor: 'green.bold.underline', // 绿色 + 加粗 + 下划线
    errorColor: 'red.bold.bgWhite', // 红字 + 加粗 + 白底
  },
})
```

> 终端是否真正着色由 `TerminalColor` 自动检测（`NO_COLOR` / `FORCE_COLOR` 环境变量、是否为 TTY、终端类型等）。未知的 token 会在控制台给出警告并被忽略

## 🧪 测试

本仓库使用 **Vitest + jsdom** 进行单元测试

```bash
# 运行全部测试（单次）
pnpm test

# 监听模式
pnpm test:watch

# 生成覆盖率报告
pnpm test:cov
```

- 测试用例位于 [`test/`](./test) 目录（如 `browserLogger.test.js`、`nodeLogger.test.ts`、`TerminalColor.test.ts`）
- [`test/browser.html`](./test/browser.html) 是一个用于手动验证浏览器效果的演示页面，可在浏览器中打开后按 F12 查看控制台输出

## 📁 文件日志（写入本地）

Node 端可将日志在终端输出的同时写入本地文件，并基于「可选依赖」[rotating-file-stream](https://github.com/iccicci/rotating-file-stream) 实现按 **大小 / 时间** 轮转、gzip 压缩与保留清理

> 该依赖为可选项，仅在使用文件日志时才需安装：
>
> ```bash
> pnpm add rotating-file-stream
> ```

```js
import { NodeLogger } from '@jl-org/log/node'

const logger = new NodeLogger({
  prefix: 'App',
  file: {
    path: 'logs/app.log',   // 目录不存在会自动创建
    format: 'jsonl',       // 'jsonl'（默认，每行一个 JSON）或 'text'
    size: '10M',            // 按大小轮转，单位 B / K / M / G
    interval: '1d',         // 按时间轮转，单位 s / m / h / d / M，可与 size 同时使用
    maxFiles: 7,            // 最多保留 7 个轮转文件，超出自动删除最旧的
    compress: true,         // 轮转后 gzip 压缩为 .gz
    // rfsOptions: { ... }  // 透传给 rotating-file-stream 的原始配置，用于高度自定义
  },
})

logger.info('服务启动')                 // 终端彩色输出 + 文件 jsonl 落盘
logger.error('出错了', new Error('boom'))

// 进程自然退出时自动刷新关闭（autoClose 默认开启）；其它退出场景见下方「退出时的刷新」
await logger.close()
```

落盘内容为「去除 ANSI 颜色」的纯文本，终端彩色输出不受影响。默认 jsonl 示例：

```json
{"time":"2026-06-27T03:00:00.000Z","level":"info","msg":"[App] 服务启动"}
{"time":"2026-06-27T03:00:01.000Z","level":"error","msg":"[App] 出错了","detail":"Error: boom\n    at ..."}
```

**高度自定义落盘内容**：除 `level` 外，时间、字段、整行排版都可控（均向后兼容，纯增量）：

```ts
const logger = new NodeLogger({
  file: {
    path: 'logs/app.log',

    // ① 内置格式的时间字段：默认 ISO UTC。可返回字符串或 epoch 数字
    formatTime: d => new Date(d.getTime() + 8 * 3600_000).toISOString().replace('Z', '+08:00'),
    // formatTime: d => d.getTime(),   // 或数字 epoch 毫秒：最紧凑、天然可排序

    // ② 环境字段：自动并入每条 jsonl 顶层（传函数则每条求值，读实时值）；不会覆盖内置 time/level/msg
    meta: () => ({ sessionId, appVersion: '2.0.0' }),

    // ③ 整行自定义：传函数则完全接管（缺失换行会自动补）。设了它，'jsonl'/'text' 与上面的拼装都不再生效；时间从 r.date 自取
    // format: r => `${r.date.toISOString()} [${r.level}] ${r.message}`,
  },
})

// 「按调用」再挂事件级字段，与构造期 meta 合并、同名时本条优先：
logger.info('purchase', { meta: { orderId: 'o-9', sku: 'A-1' } })
// 落盘：{"sessionId":"...","appVersion":"2.0.0","orderId":"o-9","sku":"A-1","time":"2026-06-27T11:00:00.000+08:00","level":"info","msg":"[App] purchase"}
```

`meta` 分两层：**构造期**（`file.meta`）放环境默认（sessionId、版本、路由等，可用函数读实时值），**按调用**（`MethodConfig.meta`）放单条事件上下文；两者合并、本条优先。这样 bug 反馈时可 `jq 'select(.orderId=="o-9")'` 直接命中。

`format` 函数收到的 `FileLogRecord`：`{ date（原始时间实例，自己格式化）, level, message, detail, meta（已合并） }`。`formatTime` 仅作用于内置 `'jsonl'`/`'text'`。

**时区提示**：默认 ISO UTC（或返回 epoch 数字）全球可排序、无歧义，适合按时间段检索。若改本地格式，`formatTime` 里**务必保留偏移**（如 `…+08:00`），否则字符串既看不出时区、跨地区也无法正确排序。想展示用户当地时间，就另放进 `meta`、`time` 仍用 UTC：

```ts
meta: () => ({ localTime: new Date().toLocaleString(), tz: Intl.DateTimeFormat().resolvedOptions().timeZone })
```

**退出时的刷新**：

- 进程**自然退出**（事件循环排空）会自动 `close()`（`autoClose`，默认开启）
- 被**信号**打断（`SIGINT`/`SIGTERM`，如 Ctrl+C / `kill`）时 `autoClose` 不触发；可设 `handleSignals: true`，收到信号后先刷新再退出（仅当你的应用自身没有信号处理时启用，否则会与宿主关闭流程冲突）
- **Electron** 主进程会拦截退出流程，`beforeExit` 与信号都不可靠 —— 请在 `app.on('before-quit', () => logger.close())` 里手动调用

> ⚠️ `rotating-file-stream` 仅支持「按大小 / 时间」轮转，**不支持按文件行数轮转**

## 🖥️ Electron 全链路日志（渲染进程 → 主进程落盘）

桌面应用常需**分页面 / 模块收集用户操作日志**，并在用户反馈 bug 时回捞**指定时间段**的记录。本库提供一条轻量 IPC 通道：渲染进程的日志经 preload 桥转发给主进程，由主进程统一写入同一个文件（复用上文的轮转 / 压缩能力）

**全程不引入 `electron`** —— `ipcMain` / `ipcRenderer` / `contextBridge` 均由你注入，因此不增加依赖、不挑 electron 版本，并兼容 `contextIsolation` 开 / 关两种模式。三处各加几行即可：

```ts
// 1️⃣ preload.ts —— 把发送桥安全暴露给渲染进程
import { contextBridge, ipcRenderer } from 'electron'
import { exposeLogBridge } from '@jl-org/log'

exposeLogBridge(contextBridge, ipcRenderer)
```

```ts
// 2️⃣ main.ts —— 主进程接收并落盘
import { app, ipcMain } from 'electron'
import { NodeLogger, listenElectronLogs } from '@jl-org/log/node'

const logger = new NodeLogger({
  file: { path: 'logs/app.log', size: '10M', maxFiles: 5 },
})

listenElectronLogs(ipcMain, logger)              // 监听渲染进程日志，写入同一文件
app.on('before-quit', () => { void logger.close() })  // 退出前刷新关闭
```

```ts
// 3️⃣ 渲染进程 —— 每个页面 / 模块用 prefix 区分
import { BrowserLogger, forwardToMain } from '@jl-org/log'

const log = new BrowserLogger({ prefix: 'UserPage', onLog: forwardToMain })

log.info('clicked submit')   // 浏览器控制台显示 + 经 IPC 落到主进程文件
```

落盘为 jsonl，每行的 `time` 是**渲染端产生时间**（而非主进程写入时间），`prefix` 标识页面 / 模块，用 `jq` / `grep` 按时间字段即可筛出 bug 反馈所需区间：

```json
{"time":"2026-06-27T03:00:00.000Z","level":"info","msg":"[UserPage] clicked submit"}
```

**说明**：

- `onLog` 是通用订阅钩子（不止 Electron），你也可拿它把日志转发到 *WebSocket* / *Sentry* 等；受 `needLog` 控制，被抑制的日志不会触发
- 主进程侧会校验 IPC 负载结构，丢弃非法数据，避免渲染进程发来脏数据写穿文件
- `listenElectronLogs` 返回一个取消监听函数，需要时调用即可解除绑定
