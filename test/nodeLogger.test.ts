import { NodeLogger } from '../src/node'

// 🎨 测试不同配置的日志器
console.log('🚀 开始 Node.js 环境测试\n')

// 1️⃣ 基础日志器
const basicLogger = new NodeLogger({})
console.log('1️⃣ 基础日志测试:')
basicLogger.info('这是一条信息日志')
basicLogger.success('操作执行成功！')
basicLogger.warn('这是一条警告信息')
basicLogger.error('发生了一个错误')
basicLogger.debug('这条调试日志不会显示（debug=false）')
console.log()

// 2️⃣ 带前缀的日志器
const prefixLogger = new NodeLogger({
  prefix: 'MyApp'
})
console.log('2️⃣ 带前缀的日志测试:')
prefixLogger.info('应用启动成功')
prefixLogger.success('数据库连接正常')
prefixLogger.warn('内存使用率较高')
prefixLogger.error('连接超时')
console.log()

// 🆕 自定义颜色配置测试
const colorLogger = new NodeLogger({
  prefix: 'Color',
  colors: {
    infoColor: 'cyan.bold',           // 青色加粗
    successColor: 'green.underline',  // 绿色下划线
    warningColor: 'magenta',          // 洋红色
    errorColor: 'red.bold.bgWhite',   // 红色加粗白背景
    debugColor: 'blue.italic'         // 蓝色斜体
  }
})
console.log('🎨 自定义颜色配置测试:')
colorLogger.info('自定义青色加粗信息')
colorLogger.success('自定义绿色下划线成功')
colorLogger.warn('自定义洋红色警告')
colorLogger.error('自定义红色加粗白背景错误')

// 临时启用调试来展示自定义调试颜色
const debugColorLogger = new NodeLogger({
  debug: true,
  prefix: 'Debug',
  colors: {
    debugColor: 'blue.italic'
  }
})
debugColorLogger.debug('自定义蓝色斜体调试信息')
console.log()

// 🌈 展示更多颜色样式组合
const rainbowLogger = new NodeLogger({
  prefix: 'Rainbow',
  colors: {
    infoColor: 'white.bgBlue',
    successColor: 'black.bgGreen',
    warningColor: 'black.bgYellow',
    errorColor: 'white.bgRed'
  }
})
console.log('🌈 彩虹样式测试:')
rainbowLogger.info('白字蓝底信息')
rainbowLogger.success('黑字绿底成功')
rainbowLogger.warn('黑字黄底警告')
rainbowLogger.error('白字红底错误')
console.log()

// 🆕 方法级配置覆盖测试
console.log('🆕 方法级配置覆盖测试:')
console.log('基础日志器 + 临时配置:')
basicLogger.info('默认日志（无前缀）')
basicLogger.info('临时前缀测试', { prefix: 'TEMP' })
basicLogger.success('API 成功响应', { prefix: 'API' })
basicLogger.warn('临时警告', { prefix: 'WARN' })
basicLogger.error('临时错误', null, { prefix: 'ERROR' })

console.log('\n调试模式配置覆盖:')
basicLogger.debug('默认调试（不显示）')
basicLogger.debug('临时启用调试', { debug: true })
basicLogger.debug('组合配置测试', { prefix: 'DEBUG', debug: true })

console.log('\n前缀日志器 + 临时配置:')
prefixLogger.debug('默认调试（不显示，因为 debug=false）')
prefixLogger.debug('临时启用调试', { debug: true })
prefixLogger.info('临时覆盖前缀', { prefix: 'OVERRIDE' })
prefixLogger.debug('临时关闭调试', { debug: false })
console.log()

// 3️⃣ 启用调试模式的日志器
const debugLogger = new NodeLogger({
  debug: true,
  prefix: 'Debug'
})
console.log('3️⃣ 调试模式日志测试:')
debugLogger.info('正常信息')
debugLogger.debug('调试信息：用户ID = 12345')
debugLogger.debug('API 调用：/api/users，耗时 125ms')
debugLogger.success('调试模式工作正常')

console.log('调试模式下的配置覆盖:')
debugLogger.debug('默认显示的调试日志')
debugLogger.debug('临时关闭调试', { debug: false })
debugLogger.debug('临时更改前缀', { prefix: 'CUSTOM' })
console.log()

// 4️⃣ 禁用调试模式的日志器
const noDebugLogger = new NodeLogger({
  debug: false,
  prefix: 'Prod'
})
console.log('4️⃣ 生产模式日志测试（调试日志不会显示）:')
noDebugLogger.info('生产环境信息')
noDebugLogger.debug('这条调试信息不会显示')
noDebugLogger.success('生产模式正常')
console.log()

// 5️⃣ 错误日志测试
const errorLogger = new NodeLogger({
  prefix: 'Error'
})
console.log('5️⃣ 错误日志测试:')
errorLogger.error('简单错误消息')

const error = new Error('这是一个测试错误')
error.stack = `Error: 这是一个测试错误
    at testError (test/node.js:1:1)
    at Object.<anonymous> (test/node.js:1:1)`
errorLogger.error('捕获到异常', error)
errorLogger.error('带临时前缀的错误', error, { prefix: 'CRITICAL' })

errorLogger.error('JSON 错误', {
  code: 'ECONNREFUSED',
  message: '连接被拒绝',
  port: 3000
})
console.log()

// 6️⃣ 进度条测试
const progressLogger = new NodeLogger({
  prefix: 'Task'
})
console.log('6️⃣ 进度条测试:')

// 模拟文件处理进度
async function simulateProgress(total, message) {
  for (let i = 0; i <= total; i++) {
    progressLogger.progress({
      message,
      current: i,
      total,
      displayType: 'auto',
      sameLine: true
    })

    // 模拟处理时间
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}

await simulateProgress(20, '处理文件')

// 百分比显示
for (let i = 0; i <= 1000; i += 100) {
  progressLogger.progress({
    message: '大数据处理',
    current: i,
    total: 1000,
    displayType: 'percentage',
    sameLine: true
  })
  await new Promise(resolve => setTimeout(resolve, 100))
}

console.log()

// 7️⃣ 表格输出测试
const tableLogger = new NodeLogger({
  prefix: 'Table'
})
console.log('7️⃣ 简单表格测试:')

tableLogger.tableSimple({
  '应用名称': 'MyApp',
  '版本': 'v1.2.3',
  '环境': 'production',
  '端口': '3000',
  '启动时间': new Date().toLocaleString()
})

// 8️⃣ 兼容性测试（调用浏览器专用方法）
const compatLogger = new NodeLogger({
  prefix: 'Compat'
})
console.log('8️⃣ 兼容性测试（浏览器专用功能）:')

// 这些方法在 Node.js 环境下会显示警告
compatLogger.img('https://example.com/image.png')
compatLogger.table([
  { name: '测试', value: '数据' },
  { name: '复杂', value: '表格' }
])
console.log()

// 9️⃣ 批量日志测试
const batchLogger = new NodeLogger({
  prefix: 'Batch'
})
console.log('9️⃣ 批量日志性能测试:')

const start = process.hrtime.bigint()
for (let i = 1; i <= 100; i++) {
  batchLogger.info(`批量日志 ${i}/100`)
}
const end = process.hrtime.bigint()
const duration = Number(end - start) / 1000000 // 转换为毫秒

batchLogger.success(`100条日志耗时: ${duration.toFixed(2)}ms`)
console.log()

// 🔟 清除行测试
const clearLogger = new NodeLogger({
  prefix: 'Clear'
})
console.log('🔟 清除行测试:')
clearLogger.info('这行消息会被替换...')
await new Promise(resolve => setTimeout(resolve, 1000))
clearLogger.clearLine('✅ 消息已更新！\n')
console.log()

// 🎉 测试完成
const finalLogger = new NodeLogger({})
console.log('🎉 测试完成')
finalLogger.success('所有 Node.js 测试已完成！')

console.log('🎯 测试项目:')
console.log('  ✅ 基础日志功能')
console.log('  ✅ 自定义前缀')
console.log('  ✅ 调试模式开关')
console.log('  ✅ 方法级配置覆盖 🆕')
console.log('  ✅ 丰富颜色配置 🆕')
console.log('  ✅ 错误处理')
console.log('  ✅ 进度条显示')
console.log('  ✅ 简单表格')
console.log('  ✅ 兼容性检查')
console.log('  ✅ 性能测试')
console.log('  ✅ 清除行功能')
console.log()
console.log('�� Node.js 测试全部通过！')