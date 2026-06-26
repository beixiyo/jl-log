import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Vitest 配置
 *
 * - 默认运行环境为 `node`
 * - 需要 DOM 的浏览器端用例，在文件顶部加注释 `// @vitest-environment jsdom` 即可切换
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.{test,spec}.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/types.ts',
        'src/types/**',
        'src/**/constans.ts',
        'src/**/index.ts',
      ],
    },
  },
})
