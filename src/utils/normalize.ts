import type { LogOpts } from '../types'

export function normalizeOpts(opts: LogOpts) {
  return {
    infoColor: '#909399',
    errorColor: '#F56C6C',
    warningColor: '#E6A23C',
    successColor: '#67C23A',
    table: {
      header: {
        color: '#F2F7FF',
        bgc: '#1455CC'
      },
      row: {
        color: '#FFF',
        bgc: '#656C66'
      }
    },
    needLog: () => true,
    ...opts
  }
}

export const prettyPrint = (
  title: 'Info' | 'Success' | 'Warning' | 'Error' | 'Debug',
  text: string,
  color: string,
  needLog = () => true,
) => {
  if (!needLog()) return

  if (typeof title === 'object') {
    title = JSON.stringify(title) as any
  }
  if (typeof text === 'object') {
    text = JSON.stringify(text)
  }

  console.log(
    `%c ${title} %c ${text} %c`,
    `background:${color};border:1px solid ${color}; padding: 1px; border-radius: 2px 0 0 2px; color: #fff;`,
    `border:1px solid ${color}; padding: 1px; border-radius: 0 2px 2px 0; color: ${color};`,
    'background:transparent'
  )
}
