import type { LogOpts } from './types'
import { isEmpty, normalizeOpts, prettyPrint } from './utils'

export const genLog = (opts: LogOpts = {}) => {
    const {
        infoColor,
        errorColor,
        warningColor,
        successColor,
        table: {
            header,
            row,
        },
        needLog,
    } = normalizeOpts(opts)

    const needLogVal = needLog()

    const info = (textOrTitle: any, content: any = '') => {
        const title = isEmpty(content) ? 'Info' : textOrTitle
        const text = isEmpty(content) ? textOrTitle : content
        prettyPrint(title, text, infoColor, needLogVal)
    }

    const error = (textOrTitle: any, content: any = '') => {
        const title = isEmpty(content) ? 'Error' : textOrTitle
        const text = isEmpty(content) ? textOrTitle : content
        prettyPrint(title, text, errorColor, needLogVal)
    }

    const warn = (textOrTitle: any, content: any = '') => {
        const title = isEmpty(content) ? 'Warning' : textOrTitle
        const text = isEmpty(content) ? textOrTitle : content
        prettyPrint(title, text, warningColor, needLogVal)
    }

    const success = (textOrTitle: any, content: any = '') => {
        const title = isEmpty(content) ? 'Success ' : textOrTitle
        const text = isEmpty(content) ? textOrTitle : content
        prettyPrint(title, text, successColor, needLogVal)
    }

    const table = <T extends object>(data: T[]) => {
        if (!needLogVal) return

        const
            keys = Object.keys(data[0]),
            headerStr = '%c ' + keys.map(key => `${key}%c`)
                .join(' ')
                .slice(0, -2),

            genFormatter = (color = '#F2F7FF', bgc = '#1455CC') => Array
                .from({ length: keys.length }, () =>
                    `color: ${color}; background-color: ${bgc}; padding: 2px 10px;`
                )

        console.log(
            headerStr,
            ...genFormatter(header!.color, header!.bgc)
        )

        data.forEach((item: any) => {
            const headerStr = '%c' + keys
                .map((key) => {
                    let val = item[key]
                    if (typeof val === 'object') {
                        val = JSON.stringify(val)
                    }
                    
                    return `${val} %c`
                })
                .join(' ')
                .slice(0, -2)

            console.log(
                headerStr,
                ...genFormatter(row!.color, row!.bgc)
            )
        })
    }

    const img = (url: string, scale = 1) => {
        if (!needLogVal) return
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = url

        const cvs = document.createElement('canvas')
        const ctx = cvs.getContext('2d')!

        img.onload = () => {
            cvs.width = img.width
            cvs.height = img.height
            ctx.drawImage(img, 0, 0)
            const dataUri = cvs.toDataURL('image/png')

            console.log(
                `%c sup?`,
                `font-size: 1px;
                    padding: ${Math.floor((img.height * scale) / 2)}px ${Math.floor((img.width * scale) / 2)}px;
                    background-image: url(${dataUri});
                    background-repeat: no-repeat;
                    background-size: ${img.width * scale}px ${img.height * scale}px;
                    color: transparent;
                `
            )
        }
    }

    return {
        info,
        error,
        warn,
        success,
        img,
        /**
         * @example
         * const data = [
         *   { id: 1, name: 'John', age: 20 },
         *   { id: 2, name: 'Jane', age: 21 },
         * ]
         * table(data)
         */
        table
    }
}
