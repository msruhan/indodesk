import path from 'node:path'
import { defineConfig } from 'vitest/config'

const testKek = Buffer.alloc(32, 7).toString('base64')

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NODE_ENV: 'test',
      DATA_ENCRYPTION_KEY: testKek,
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
