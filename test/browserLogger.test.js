
import { BrowserLogger } from '../dist/index.js'

let disabledLog = false
const needLog = () => !disabledLog
// 创建默认日志实例
const defaultLogger = new BrowserLogger({ needLog })

// 创建带前缀和调试的日志实例
const prefixLogger = new BrowserLogger({
  prefix: 'MyApp',
  debug: true,
  needLog
})

// 创建自定义颜色日志实例
const customLogger = new BrowserLogger({
  infoColor: '#00BCD4',
  successColor: '#4CAF50',
  warningColor: '#FF9800',
  errorColor: '#F44336',
  needLog
})

// 创建夜间模式日志实例
const nightLogger = new BrowserLogger({
  infoColor: '#81C784',
  successColor: '#66BB6A',
  warningColor: '#FFB74D',
  errorColor: '#EF5350',
  needLog
})

// 创建禁用日志实例
const disabledLogger = new BrowserLogger({
  needLog
})

// 测试基础日志
function testBasicLogs() {
  console.group('🎯 基础日志测试')
  defaultLogger.info('这是一条信息日志')
  defaultLogger.success('操作执行成功！')
  defaultLogger.warn('这是一条警告信息')
  defaultLogger.error('发生了一个错误')
  defaultLogger.debug('这条调试日志不会显示（debug=false）')
  console.groupEnd()
}

// 测试前缀功能
function testPrefix() {
  console.group('🏷️ 前缀功能测试')
  prefixLogger.info('带前缀的信息日志')
  prefixLogger.success('带前缀的成功日志')
  prefixLogger.debug('带前缀的调试日志（会显示）')
  console.groupEnd()
}

// 测试方法级配置覆盖
function testMethodConfig() {
  console.group('⚙️ 方法级配置覆盖测试')

  // 临时覆盖前缀
  defaultLogger.info('默认日志（无前缀）')
  defaultLogger.info('临时前缀测试', { prefix: 'TEMP' })
  defaultLogger.success('另一个临时前缀', { prefix: 'API' })

  // 临时启用调试
  defaultLogger.debug('默认调试（不显示）')
  defaultLogger.debug('临时启用调试', { debug: true })

  // 同时覆盖前缀和调试
  defaultLogger.debug('组合配置测试', { prefix: 'DEBUG', debug: true })

  console.groupEnd()
}

// 测试带错误对象的日志
function testWithError() {
  console.group('❌ 错误日志测试')
  const error = new Error('这是一个测试错误')
  error.stack = `Error: 这是一个测试错误
at testWithError (browser.html:1:1)
at HTMLButtonElement.onclick (browser.html:1:1)`

  defaultLogger.error('捕获到异常', error)
  defaultLogger.error('网络请求失败', { status: 404, message: 'Not Found' })
  defaultLogger.error('带前缀的错误', error, { prefix: 'API' })
  console.groupEnd()
}

// 测试调试日志
function testDebug() {
  console.group('🐛 调试日志测试')

  // 默认关闭调试的日志器
  defaultLogger.debug('这条调试日志不会显示（默认关闭）')
  defaultLogger.debug('临时启用的调试日志', { debug: true })

  // 默认开启调试的日志器
  prefixLogger.debug('默认启用的调试日志')
  prefixLogger.debug('临时关闭的调试日志', { debug: false })

  console.groupEnd()
}

// 测试自定义颜色
function testCustomColors() {
  console.group('🎨 自定义颜色测试')
  customLogger.info('青色信息日志')
  customLogger.success('绿色成功日志')
  customLogger.warn('橙色警告日志')
  customLogger.error('红色错误日志')
  console.groupEnd()
}

// 测试夜间模式
function testNightMode() {
  console.group('🌙 夜间模式测试')
  nightLogger.info('夜间模式信息')
  nightLogger.success('夜间模式成功')
  nightLogger.warn('夜间模式警告')
  nightLogger.error('夜间模式错误')
  console.groupEnd()
}

// 测试表格
function testTable() {
  console.group('📊 用户表格测试')
  const userData = [
    { id: 1, name: '张三', age: 25, city: '北京' },
    { id: 2, name: '李四', age: 30, city: '上海' },
    { id: 3, name: '王五', age: 28, city: '广州' }
  ]
  defaultLogger.table(userData)
  console.groupEnd()
}

// 测试产品表格
function testProductTable() {
  console.group('📦 产品表格测试')
  const products = [
    { name: 'iPhone 15', price: 5999, stock: 100, category: '手机' },
    { name: 'MacBook Pro', price: 12999, stock: 50, category: '电脑' },
    { name: 'AirPods Pro', price: 1999, stock: 200, category: '耳机' }
  ]
  defaultLogger.table(products)
  console.groupEnd()
}

// 测试复杂表格
function testComplexTable() {
  console.group('🔧 复杂表格测试')
  const complexData = [
    {
      id: 1,
      config: { theme: 'dark', lang: 'zh' },
      features: ['logging', 'table', 'image'],
      status: true
    },
    {
      id: 2,
      config: { theme: 'light', lang: 'en' },
      features: ['logging', 'table'],
      status: false
    }
  ]
  defaultLogger.table(complexData)
  console.groupEnd()
}

// 测试图片
function testImage() {
  console.group('🖼️ 图片测试')
  defaultLogger.info('正在加载图片...')
  // 使用一个小的 base64 图片进行测试
  const smallImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  defaultLogger.img(smallImage)
  console.groupEnd()
}

// 测试缩放图片
function testImageScale() {
  console.group('🔍 图片缩放测试')
  const smallImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  defaultLogger.info('原始大小图片')
  defaultLogger.img(smallImage, 1)
  defaultLogger.info('2倍缩放图片')
  defaultLogger.img(smallImage, 2)
  console.groupEnd()
}

// 测试禁用日志
function testDisableLog() {
  disabledLog = true
}

// 测试生产模式
function testProductionMode() {
  console.group('🏭 测试打开日志')
  disabledLog = false
}

// 批量日志测试
function testBatchLogs() {
  console.group('📦 批量日志测试')
  for (let i = 1; i <= 10; i++) {
    defaultLogger.info(`批量日志 ${i}/10`)
  }
  console.groupEnd()
}

// 性能测试
function testPerformance() {
  console.group('⚡ 性能测试')
  const start = performance.now()

  for (let i = 0; i < 100; i++) {
    defaultLogger.info(`性能测试日志 ${i + 1}/100`)
  }

  const end = performance.now()
  defaultLogger.success(`100条日志耗时: ${(end - start).toFixed(2)}ms`)
  console.groupEnd()
}

// 测试所有新功能
function testAllNewFeatures() {
  console.group('🚀 新功能全面测试')
  testPrefix()
  testMethodConfig()
  console.groupEnd()
}

// 等待 DOM 加载完成后绑定事件
document.addEventListener('DOMContentLoaded', () => {
  // 基础日志测试
  document.getElementById('testBasicLogs')?.addEventListener('click', testBasicLogs)
  document.getElementById('testWithError')?.addEventListener('click', testWithError)
  document.getElementById('testDebug')?.addEventListener('click', testDebug)

  // 新功能测试
  document.getElementById('testPrefix')?.addEventListener('click', testPrefix)
  document.getElementById('testMethodConfig')?.addEventListener('click', testMethodConfig)
  document.getElementById('testAllNewFeatures')?.addEventListener('click', testAllNewFeatures)

  // 自定义颜色测试
  document.getElementById('testCustomColors')?.addEventListener('click', testCustomColors)
  document.getElementById('testNightMode')?.addEventListener('click', testNightMode)

  // 表格测试
  document.getElementById('testTable')?.addEventListener('click', testTable)
  document.getElementById('testProductTable')?.addEventListener('click', testProductTable)
  document.getElementById('testComplexTable')?.addEventListener('click', testComplexTable)

  // 图片测试
  document.getElementById('testImage')?.addEventListener('click', testImage)
  document.getElementById('testImageScale')?.addEventListener('click', testImageScale)

  // 配置测试
  document.getElementById('testDisableLog')?.addEventListener('click', testDisableLog)
  document.getElementById('testProductionMode')?.addEventListener('click', testProductionMode)

  // 压力测试
  document.getElementById('testBatchLogs')?.addEventListener('click', testBatchLogs)
  document.getElementById('testPerformance')?.addEventListener('click', testPerformance)
})

// 将测试函数绑定到 window 对象上（保持向后兼容）
const testFunctions = {
  testBasicLogs,
  testWithError,
  testDebug,
  testPrefix,
  testMethodConfig,
  testAllNewFeatures,
  testCustomColors,
  testNightMode,
  testTable,
  testProductTable,
  testComplexTable,
  testImage,
  testImageScale,
  testDisableLog,
  testProductionMode,
  testBatchLogs,
  testPerformance
}

// 将所有测试函数添加到 window 对象
Object.assign(window, testFunctions)
