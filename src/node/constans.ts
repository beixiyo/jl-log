/** ANSI 转义序列常量 */
export const ANSI = {
  // 重置所有样式
  reset: '\x1b[0m',

  // 文本颜色
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  grey: '\x1b[90m',

  // 背景颜色
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // 文本修饰
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',
  inverse: '\x1b[7m',
  hidden: '\x1b[8m',
  strikethrough: '\x1b[9m'
} as const

/** ANSI 代码键类型 */
export type AnsiKey = keyof typeof ANSI

/** ANSI 代码值类型 */
export type AnsiValue = typeof ANSI[AnsiKey]

/** ANSI 常量类型 */
export type AnsiConstants = typeof ANSI