// @ts-check
import { defineConfig } from 'rollup'
import terser from '@rollup/plugin-terser'
import typescript from '@rollup/plugin-typescript'
import alias from '@rollup/plugin-alias'
import clear from 'rollup-plugin-clear'
import { fileURLToPath } from 'node:url'

const isDev = process.env.NODE_ENV === 'development'

const plugins = [
  // 只在生产模式下启用代码压缩
  !isDev && terser(),
  typescript(),
  clear({
    targets: ['dist'],
    watch: true,
  }),

  alias({
    entries: [
      {
        find: '@',
        replacement: fileURLToPath(
          new URL('src', import.meta.url)
        )
      },
    ]
  }),
]

export default defineConfig([
  {
    input: './src/index.ts',
    output: [
      {
        file: 'dist/index.cjs',
        format: 'cjs'
      },
      {
        file: 'dist/index.js',
        format: 'esm'
      },
    ],
    plugins,
  },
  {
    input: './src/node/index.ts',
    output: [
      {
        file: 'dist/node/index.cjs',
        format: 'cjs'
      },
      {
        file: 'dist/node/index.js',
        format: 'esm'
      },
    ],
    plugins,
  },
])
