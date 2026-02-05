import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: process.env.DATABASE_URL ?? 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: process.env.JWT_SECRET ?? 'test-secret-key-minimum-32-characters-long!!',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-min-32-chars-ok!!',
      CORS_ORIGIN: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    },
  },
})
