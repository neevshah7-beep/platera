import { defineConfig } from 'vitest/config'
import path from 'node:path'

// Runs against a real Postgres (platera_test). Start it with `npm run db:dev`.
export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globalSetup: ['tests/integration/setup.ts'],
    fileParallelism: false,
    testTimeout: 30_000,
    env: { DATABASE_URL: 'postgresql://platera:platera@localhost:5433/platera_test?connection_limit=25' },
  },
})
