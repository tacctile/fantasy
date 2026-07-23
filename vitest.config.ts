import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

/**
 * Vitest — the project's durable test runner (established Wave 3b resilience
 * item 2, Nick's Clarify 2026-07-23; before this every verification was a
 * throwaway tsx harness). `node` environment: the current suite is pure
 * functions and a fake in-memory Supabase client — no DOM. The `@/` alias
 * mirrors tsconfig's `paths` so tests import the same way source does.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
