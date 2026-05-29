import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

const WORKTREE = resolve(__dirname)
const MAIN_REPO = resolve('/home/deploy/gmao-saas')

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
  },
  resolve: {
    alias: {
      '@': resolve(WORKTREE, './src'),
      'server-only': resolve(MAIN_REPO, './src/__mocks__/server-only.ts'),
    },
  },
})
