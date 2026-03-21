import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { generate } from '../../src/cli/generate';

const FIXTURES_DIR = join(__dirname, '__fixtures__');
const OUTPUT_DIR = join(__dirname, '__output__');

const sampleSpec = {
  openapi: '3.0.0',
  info: { title: 'Test', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        'x-filter-grammar': {
          filterParam: 'filter',
          sortParam: 'sort',
          fields: {
            name: { operators: ['=', '!='], type: 'string' },
            status: { operators: ['='], type: 'enum', values: ['active', 'inactive'] },
            age: { operators: ['>=', '<='], type: 'number' },
          },
          sortable: ['name', 'age'],
        },
      },
    },
    '/orders': {
      get: {
        'x-filter-grammar': {
          filterParam: 'filter',
          sortParam: 'sort',
          fields: {
            total: { operators: ['>=', '<='], type: 'number' },
          },
          sortable: ['total'],
        },
      },
    },
  },
};

beforeEach(() => {
  mkdirSync(FIXTURES_DIR, { recursive: true });
});

afterEach(() => {
  rmSync(FIXTURES_DIR, { recursive: true, force: true });
  rmSync(OUTPUT_DIR, { recursive: true, force: true });
});

describe('generate', () => {
  it('generates files from JSON spec', () => {
    const specPath = join(FIXTURES_DIR, 'spec.json');
    writeFileSync(specPath, JSON.stringify(sampleSpec));

    generate(specPath, OUTPUT_DIR);

    expect(existsSync(join(OUTPUT_DIR, 'users.ts'))).toBe(true);
    expect(existsSync(join(OUTPUT_DIR, 'orders.ts'))).toBe(true);
    expect(existsSync(join(OUTPUT_DIR, 'index.ts'))).toBe(true);

    const usersContent = readFileSync(join(OUTPUT_DIR, 'users.ts'), 'utf-8');
    expect(usersContent).toContain('FilterUsers');
    expect(usersContent).toContain('SortUsers');

    const indexContent = readFileSync(join(OUTPUT_DIR, 'index.ts'), 'utf-8');
    expect(indexContent).toContain("from './users'");
    expect(indexContent).toContain("from './orders'");
  });

  it('generates files from YAML spec', () => {
    const yaml = require('js-yaml');
    const specPath = join(FIXTURES_DIR, 'spec.yaml');
    writeFileSync(specPath, yaml.dump(sampleSpec));

    generate(specPath, OUTPUT_DIR);

    expect(existsSync(join(OUTPUT_DIR, 'users.ts'))).toBe(true);
  });

  it('warns when no x-filter-grammar found', () => {
    const specPath = join(FIXTURES_DIR, 'empty.json');
    writeFileSync(specPath, JSON.stringify({
      openapi: '3.0.0',
      info: { title: 'Test', version: '1.0.0' },
      paths: { '/users': { get: {} } },
    }));

    generate(specPath, OUTPUT_DIR);
    expect(existsSync(join(OUTPUT_DIR, 'users.ts'))).toBe(false);
  });

  it('throws for invalid file', () => {
    expect(() => generate('/nonexistent.json', OUTPUT_DIR)).toThrow();
  });
});
