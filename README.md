# 一个超级美丽的打印工具

> iife 模式下全局导出一个 `_log`

## 安装

```bash
npm i @jl-org/log
```

---


## 使用

```ts
import { genLog } from '@jl-org/log'


const log = genLog(/** 配置，详见文档注释 */)

log.info('hello world')
log.warn('hello world')
log.error('hello world')
/** 标题可选 */
log.success('SuccessTitle', 'hello world')


const data = [
    { id: 1, name: 'John', age: 20 },
    { id: 2, name: 'Jane', age: 21 },
]
log.table(data)


/** 打印图片 */
log.img('yourSrc')
```

---


## 配置

```ts
type LogOpts = {
    /** 是否需要打印，可根据环境配置，建议用构建工具删除打印 */
    needLog?: () => boolean
    /** 默认 #909399 */
    infoColor?: string
    /** 默认 #F56C6C */
    errorColor?: string
    /** 默认 #E6A23C */
    warningColor?: string
    /** 默认 #67C23A */
    successColor?: string
    /** 表格颜色 */
    table?: {
        /** 表头 */
        header?: {
            /** 默认 #F2F7FF */
            color?: string
            /** 默认 #1455CC */
            bgc?: string
        },
        /** 行 */
        row?: {
            /** 默认 #FFF */
            color?: string
            /** 默认 #656C66 */
            bgc?: string
        }
    }
}
```
