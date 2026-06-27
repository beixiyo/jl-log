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

Node 端可将日志在终端输出的同时写入本地文件，并基于「可选依赖」[rotating-file-stream](https://github.com/iccicci/rotating-file-stream) 实现按 **大小 / 时间** 轮转、gzip 压缩与保留清理。

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
    format: 'ndjson',       // 'ndjson'（默认，每行一个 JSON）或 'text'
    size: '10M',            // 按大小轮转，单位 B / K / M / G
    interval: '1d',         // 按时间轮转，单位 s / m / h / d / M，可与 size 同时使用
    maxFiles: 7,            // 最多保留 7 个轮转文件，超出自动删除最旧的
    compress: true,         // 轮转后 gzip 压缩为 .gz
    // rfsOptions: { ... }  // 透传给 rotating-file-stream 的原始配置，用于高度自定义
  },
})

logger.info('服务启动')                 // 终端彩色输出 + 文件 NDJSON 落盘
logger.error('出错了', new Error('boom'))

// 进程自然退出时自动刷新关闭（autoClose 默认开启）；其它退出场景见下方「退出时的刷新」
await logger.close()
```

落盘内容为「去除 ANSI 颜色」的纯文本，终端彩色输出不受影响。默认 NDJSON 示例：

```json
{"time":"2026-06-27T03:00:00.000Z","level":"info","msg":"[App] 服务启动"}
{"time":"2026-06-27T03:00:01.000Z","level":"error","msg":"[App] 出错了","detail":"Error: boom\n    at ..."}
```

**退出时的刷新**：

- 进程**自然退出**（事件循环排空）会自动 `close()`（`autoClose`，默认开启）
- 被**信号**打断（`SIGINT`/`SIGTERM`，如 Ctrl+C / `kill`）时 `autoClose` 不触发；可设 `handleSignals: true`，收到信号后先刷新再退出（仅当你的应用自身没有信号处理时启用，否则会与宿主关闭流程冲突）
- **Electron** 主进程会拦截退出流程，`beforeExit` 与信号都不可靠 —— 请在 `app.on('before-quit', () => logger.close())` 里手动调用

> ⚠️ `rotating-file-stream` 仅支持「按大小 / 时间」轮转，**不支持按文件行数轮转**。

## 🗺️ Roadmap / 备注

- ✅ **写入本地日志文件**：已支持按大小 / 时间轮转、gzip 压缩与保留清理（见上文「文件日志」）
- 📝 **按文件行数轮转**：rotating-file-stream 不支持，暂未提供

## 🛠️ 本地开发

```bash
# 克隆项目
git clone https://github.com/beixiyo/jl-log.git
cd jl-log

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test
```

## 📄 License

[MIT](./LICENSE) © [CJL](https://github.com/beixiyo)

---

<div align="center">

**如果这个项目对你有帮助，请给个 ⭐ Star 支持一下！**

Made with ❤️ by [CJL](https://github.com/beixiyo)

</div>
