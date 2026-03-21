import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    testTimeout: 15000,
  },
  resolve: {
    alias: {
      '@nestjs-filter-grammar/core': path.resolve(__dirname, '../core/src/index.ts'),
      '@nestjs-filter-grammar/typeorm': path.resolve(__dirname, '../typeorm/src/index.ts'),
      '@nestjs-filter-grammar/prisma': path.resolve(__dirname, '../prisma/src/index.ts'),
      '@nestjs-filter-grammar/mikroorm': path.resolve(__dirname, '../mikroorm/src/index.ts'),
    },
  },
});
