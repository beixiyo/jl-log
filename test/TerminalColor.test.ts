/**
 * 颜色工具测试文件
 * 展示各种颜色、修饰符和链式调用的效果
 */

import { terminalColor } from '../src/node'


console.log('🎨 颜色工具测试开始\n')

// 1. 基本颜色测试
console.log('📌 基本颜色测试:')
console.log(terminalColor.red('红色文本'))
console.log(terminalColor.green('绿色文本'))
console.log(terminalColor.blue('蓝色文本'))
console.log(terminalColor.yellow('黄色文本'))
console.log(terminalColor.magenta('洋红色文本'))
console.log(terminalColor.cyan('青色文本'))
console.log(terminalColor.gray('灰色文本'))
console.log('')

// 2. 背景颜色测试
console.log('📌 背景颜色测试:')
console.log(terminalColor.bgRed('红色背景'))
console.log(terminalColor.bgGreen('绿色背景'))
console.log(terminalColor.bgBlue('蓝色背景'))
console.log(terminalColor.bgYellow('黄色背景'))
console.log('')

// 3. 文本修饰测试
console.log('📌 文本修饰测试:')
console.log(terminalColor.bold('粗体文本'))
console.log(terminalColor.italic('斜体文本'))
console.log(terminalColor.underline('下划线文本'))
console.log(terminalColor.strikethrough('删除线文本'))
console.log(terminalColor.dim('暗淡文本'))
console.log(terminalColor.inverse('反色文本'))
console.log('')

// 4. 链式调用测试（使用 parseColor 方法）
console.log('📌 链式调用测试:')
console.log(terminalColor.parseColor('red.bold')('红色粗体'))
console.log(terminalColor.parseColor('blue.underline')('蓝色下划线'))
console.log(terminalColor.parseColor('green.italic')('绿色斜体'))
console.log(terminalColor.parseColor('yellow.bold.underline')('黄色粗体下划线'))
console.log(terminalColor.parseColor('magenta.strikethrough')('洋红色删除线'))
console.log('')

// 5. 复杂组合测试
console.log('📌 复杂组合测试:')
console.log(terminalColor.parseColor('bgBlue.white.bold')('蓝色背景白色粗体'))
console.log(terminalColor.parseColor('bgRed.yellow.bold.underline')('红色背景黄色粗体下划线'))
console.log(terminalColor.parseColor('bgGreen.black.italic')('绿色背景黑色斜体'))
console.log('')

// 6. 实际应用场景测试
console.log('📌 实际应用场景测试:')
console.log('✅ ' + terminalColor.parseColor('green.bold')('成功: 操作完成'))
console.log('❌ ' + terminalColor.parseColor('red.bold')('错误: 操作失败'))
console.log('⚠️  ' + terminalColor.parseColor('yellow.bold')('警告: 请注意'))
console.log('ℹ️  ' + terminalColor.parseColor('blue.bold')('信息: 提示内容'))
console.log('🐛 ' + terminalColor.gray('调试: 调试信息'))
console.log('')

// 7. 进度条模拟测试
console.log('📌 进度条模拟测试:')
const progressBar = (percent: number) => {
  const width = 20
  const completed = Math.floor(width * percent / 100)
  const remaining = width - completed
  const bar = terminalColor.green('█'.repeat(completed)) + terminalColor.gray('░'.repeat(remaining))
  return `[${bar}] ${percent}%`
}

console.log('下载进度: ' + progressBar(0))
console.log('下载进度: ' + progressBar(25))
console.log('下载进度: ' + progressBar(50))
console.log('下载进度: ' + progressBar(75))
console.log('下载进度: ' + progressBar(100))
console.log('')

// 8. 表格样式测试
console.log('📌 表格样式测试:')
const tableData = [
  { name: '项目名称', value: 'jl-log' },
  { name: '版本号', value: '1.0.0' },
  { name: '作者', value: 'CJL' },
  { name: '许可证', value: 'MIT' }
]

const maxKeyLength = Math.max(...tableData.map(item => item.name.length))
tableData.forEach(({ name, value }) => {
  const paddedKey = name.padEnd(maxKeyLength)
  console.log(`${terminalColor.dim('│')} ${terminalColor.parseColor('bold.cyan')(paddedKey)} ${terminalColor.dim('│')} ${value}`)
})
console.log('')

// 9. 颜色支持检测测试
console.log('📌 颜色支持检测测试:')
console.log(`颜色支持状态: ${terminalColor.isEnabled() ? terminalColor.green('已启用') : terminalColor.red('已禁用')}`)
console.log(`终端类型: ${process.env.TERM || '未知'}`)
console.log(`是否为 TTY: ${process.stdout.isTTY ? terminalColor.green('是') : terminalColor.red('否')}`)
console.log('')

// 10. 禁用/启用颜色测试
console.log('📌 禁用/启用颜色测试:')
console.log('正常颜色: ' + terminalColor.red('红色文本'))
terminalColor.disable()
console.log('禁用颜色: ' + terminalColor.red('红色文本'))
terminalColor.enable()
console.log('重新启用: ' + terminalColor.red('红色文本'))
console.log('')

// 11. 自定义颜色字符串解析测试
console.log('📌 自定义颜色字符串解析测试:')
const colorStrings = [
  'red',
  'blue.bold',
  'green.underline',
  'yellow.bold.underline',
  'magenta.strikethrough',
  'bgRed.white.bold',
  'bgBlue.yellow.italic',
  'cyan.dim'
]

colorStrings.forEach(colorStr => {
  console.log(`${colorStr}: ` + terminalColor.parseColor(colorStr)(`测试文本 - ${colorStr}`))
})
console.log('')

console.log('🎨 颜色工具测试完成!')
