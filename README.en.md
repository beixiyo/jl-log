# 🎨 @jl-org/log

<div align="center">

**A Beautiful Cross-Platform Logging Tool** ✨

*Zero-dependency, colorful log output for both Browser and Node.js*

[![NPM Version](https://img.shields.io/npm/v/@jl-org/log.svg)](https://www.npmjs.com/package/@jl-org/log)
[![License](https://img.shields.io/npm/l/@jl-org/log.svg)](https://github.com/beixiyo/jl-log/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dy/@jl-org/log.svg)](https://www.npmjs.com/package/@jl-org/log)

**English** | [中文](./README.md)

</div>

## ✨ Key Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🌐 **Cross-Platform** | Seamless switching between Browser + Node.js environments | ✅ |
| 🎨 **Beautiful Output** | Browser color tags + Node.js self-implemented ANSI colored terminal | ✅ |
| 📦 **Zero Dependencies** | No external dependencies at all, self-implemented color system (kleur removed in 2.0.0) | ✅ |
| 🔧 **Unified API** | Same interface for both environments, low learning curve | ✅ |
| 🎯 **TypeScript** | Complete type definitions, great development experience | ✅ |
| ⚡ **High Performance** | Optimized rendering, millisecond-level response | ✅ |

## 📸 Effect Preview

### 🖥️ Browser Environment

![browser-logger](./docAssets/browser.webp)

*Colorful tag effects in the browser console*

### 🖥️ Node.js Terminal

![node-logger](./docAssets/node.webp)

*Colored text effects in the Node.js terminal*

---

## 📦 Installation

```bash
# Using pnpm (recommended)
pnpm add @jl-org/log

# Using npm
npm install @jl-org/log

# Using yarn
yarn add @jl-org/log
```

### Node.js Environment Support

The Node.js environment ships with built-in color support — no extra dependencies required.

> 💡 **Self-implemented Color System**
> We use a self-implemented `TerminalColor` class to handle terminal colors via ANSI escape sequences, with no external dependencies (the previous `kleur` dependency was removed in 2.0.0).

## 🚀 Quick Start

### 🌐 Browser Environment

```html
<!DOCTYPE html>
<html>
<head>
  <title>Logger Demo</title>
</head>
<body>
  <script type="module">
    import { BrowserLogger } from '@jl-org/log'

    // Create a logger instance
    const logger = new BrowserLogger({
      // needLog lets your bundler tree-shake logs out of production builds.
      // Use a build-time flag — `process` does NOT exist in the browser.
      needLog: () => import.meta.env?.DEV ?? true,
      prefix: 'MyApp',
      debug: true
    })

    // Basic usage
    logger.info('🚀 Application started successfully')
    logger.success('✅ Data loaded')
    logger.warn('⚠️ High memory usage')
    logger.error('❌ Network connection failed')
    logger.debug('🐛 Debug information')

    // Method-level configuration override
    logger.info('Temporary prefix test', { prefix: 'TEMP' })
    logger.debug('Temporarily enable debug', { debug: true })
    logger.error('API error', null, { prefix: 'API' })

    // Table display
    const users = [
      { id: 1, name: 'John', role: 'Admin' },
      { id: 2, name: 'Jane', role: 'User' }
    ]
    logger.table(users)

    // Image display (browser only)
    logger.img('https://example.com/logo.png', 0.5)
  </script>
</body>
</html>
```

### 🖥️ Node.js Environment

```js
import { NodeLogger } from '@jl-org/log/node'

// Create a logger instance
const logger = new NodeLogger({
  debug: process.env.NODE_ENV === 'development',
  prefix: 'MyApp'
})

// Basic usage
logger.info('🚀 Server started successfully')
logger.success('✅ Database connected')
logger.warn('⚠️ High memory usage')
logger.error('❌ Redis connection failed')
logger.debug('🐛 Debug info: User ID = 12345')

// Method-level configuration override
logger.info('Temporary prefix test', { prefix: 'TEMP' })
logger.debug('Temporarily enable debug', { debug: true })
logger.error('API error', null, { prefix: 'API' })

// Custom color configuration
const colorLogger = new NodeLogger({
  prefix: 'App',
  colors: {
    infoColor: 'cyan.bold',          // Bold cyan
    successColor: 'green.underline', // Green underline
    warningColor: 'magenta',         // Magenta
    errorColor: 'red.bold.bgWhite'   // Bold red on white background
  }
})

colorLogger.info('Custom styled info log')
colorLogger.success('Custom styled success log')

// Progress bar (Node.js only)
for (let i = 0; i <= 100; i += 10) {
  logger.progress({
    message: 'Processing data',
    current: i,
    total: 100,
    displayType: 'percentage'
  })
  await new Promise(resolve => setTimeout(resolve, 100))
}

// Simple key-value table (Node.js only)
logger.tableSimple({
  'App': 'MyApp',
  'Version': 'v2.0.0',
  'Environment': 'production',
  'Port': '3000'
})

// Low-level terminal helpers (Node.js only)
logger.clearLine('Replacing the current line...') // clear current line and write new content
logger.newLine()                                  // print an empty line
logger.log('Plain cyan text with prefix')         // print plain text
```

## 📖 API & Configuration Reference

### 🎯 Base Config (shared by both environments)

```typescript
/** Base logging options */
interface BaseLogOpts {
  /** Enable debug mode */
  debug?: boolean
  /** Log prefix */
  prefix?: string
  /** Whether logs should print; configure per environment. Recommended to let your build tool strip logs */
  needLog?: () => boolean
}
```

### 🎨 BrowserLogger Config (`LogOpts`)

```typescript
interface LogOpts extends BaseLogOpts {
  /** Default: #909399 */
  infoColor?: string
  /** Default: #F56C6C */
  errorColor?: string
  /** Default: #E6A23C */
  warningColor?: string
  /** Default: #67C23A */
  successColor?: string

  /** Table style configuration */
  table?: {
    /** Header */
    header?: {
      /** Default: #F2F7FF */
      color?: string
      /** Default: #1455CC */
      bgc?: string
    }
    /** Row */
    row?: {
      /** Default: #FFF */
      color?: string
      /** Default: #656C66 */
      bgc?: string
    }
  }
}
```

### 🖥️ NodeLogger Config (`NodeLogOpts` / `TerminalColorConfig`)

```typescript
interface NodeLogOpts extends BaseLogOpts {
  /** Color configuration */
  colors?: TerminalColorConfig
}

interface TerminalColorConfig {
  /** Info log color, supports any TerminalColor color and chaining, e.g. 'blue' or 'blue.bold'. Default: 'blue' */
  infoColor?: ColorString
  /** Success log color. Default: 'green' */
  successColor?: ColorString
  /** Warning log color. Default: 'yellow' */
  warningColor?: ColorString
  /** Error log color. Default: 'red' */
  errorColor?: ColorString
  /** Debug log color. Default: 'gray' */
  debugColor?: ColorString
}

/** Progress bar configuration (NodeLogger.progress) */
interface ProgressConfig {
  /** Progress message */
  message: string
  /** Current progress */
  current: number
  /** Total progress */
  total: number
  /** Prefix */
  prefix?: string
  /** Display type: 'percentage' | 'fraction' | 'auto' */
  displayType?: ProgressDisplayType
  /** Custom progress text */
  customText?: string
  /** Render on the same line (default: true) */
  sameLine?: boolean
}
```

### ⚙️ Method-level Config (`MethodConfig`)

```typescript
/** Method-level options — temporarily override constructor config */
interface MethodConfig {
  /** Temporarily override the prefix */
  prefix?: string
  /** Temporarily override debug mode */
  debug?: boolean
}
```

### 🔧 Unified Interface (`ILogger`)

```typescript
interface ILogger {
  info(message: string, config?: MethodConfig): void
  success(message: string, config?: MethodConfig): void
  warn(message: string, config?: MethodConfig): void
  error(message: string, error?: any, config?: MethodConfig): void
  debug?(message: string, config?: MethodConfig): void
  /** Print an image (browser only) */
  img?(url: string, scale?: number): void
  /** Print a table */
  table?<T extends object>(data: T[]): void
}
```

## 🔍 Browser vs Node Feature Matrix

| Feature | 🌐 Browser | 🖥️ Node.js | 📝 Description |
|---------|------------|-------------|----------------|
| **Basic Logging** | ✅ | ✅ | `info`, `success`, `warn`, `error` |
| **Debug Logging** | ✅ | ✅ | `debug` method with on/off control |
| **Prefix Support** | ✅ | ✅ | Unified custom prefix support |
| **Method-level Config** | ✅ | ✅ | Temporarily override `prefix`, `debug`, etc. |
| **Error Stack** | ✅ | ✅ | Displays `Error` objects / stacks |
| **Table Printing** | ✅ Full | ⚠️ Simple | Full styled table in browser; use `tableSimple` in Node.js |
| **Image Printing** | ✅ | ❌ Warns | Browser only; Node.js prints a warning |
| **Progress Bar** | ❌ | ✅ | Node.js exclusive (`progress`) |
| **Colored Output** | ✅ CSS | ✅ ANSI | Browser uses CSS styles, Node.js uses self-implemented ANSI |

## 🌈 Node Color String Reference

Node colors are expressed as strings and can be **chained with `.`** to combine a color, a background, and modifiers, e.g. `'green.bold.underline'` or `'red.bold.bgWhite'`.

| Category | Available values |
|----------|------------------|
| **Basic colors** | `black` `red` `green` `yellow` `blue` `magenta` `cyan` `white` `gray` `grey` |
| **Background colors** | `bgBlack` `bgRed` `bgGreen` `bgYellow` `bgBlue` `bgMagenta` `bgCyan` `bgWhite` |
| **Modifiers** | `bold` `dim` `italic` `underline` `inverse` `hidden` `strikethrough` |

```ts
colors: {
  infoColor: 'cyan',                 // single color
  successColor: 'green.bold',        // color + modifier
  warningColor: 'yellow.underline',  // color + modifier
  errorColor: 'red.bold.bgWhite'     // color + modifier + background
}
```

## 🧪 Testing

This repo uses **Vitest** (with **jsdom** for the browser-side specs). The specs live under `test/`, and `test/browser.html` is a manual browser demo page.

```bash
# Run all tests once
pnpm test          # vitest run

# Watch mode
pnpm test:watch    # vitest

# Coverage report
pnpm test:cov      # vitest run --coverage
```

## 🗺️ Roadmap / Notes

- 📁 **Writing logs to local files** (with rotation / formatting) is currently **under evaluation** — it is *not* implemented yet.

## 🛠️ Local Development

```bash
# Clone the project
git clone https://github.com/beixiyo/jl-log.git
cd jl-log

# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test
```

## 📄 License

[MIT](https://github.com/beixiyo/jl-log/blob/main/LICENSE)

---

<div align="center">

**If this project helps you, please give it a ⭐ Star!**

Made with ❤️ by [CJL](https://github.com/beixiyo)

</div>
