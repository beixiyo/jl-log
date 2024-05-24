export type LogOpts = {
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
