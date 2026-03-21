import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './',
  },
  resolve: {
    alias: {
      '@nestjs-filter-grammar/core': path.resolve(__dirname, '../core/src/index.ts'),
    },
  },
});
