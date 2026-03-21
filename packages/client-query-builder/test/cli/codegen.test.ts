import { describe, it, expect } from 'vitest';
import { generateFile, generateBarrel } from '../../src/cli/codegen';

describe('generateFile', () => {
  it('generates filter and sort for string fields', () => {
    const output = generateFile('Users', {
      fields: {
        name: { operators: ['=', '!='], type: 'string' },
      },
      sortable: ['name'],
    });
    expect(output).toContain('export const FilterUsers');
    expect(output).toContain("field<string>('name'");
    expect(output).toContain('export const SortUsers');
    expect(output).toContain("sortField('name')");
    expect(output).toContain("from '@nestjs-filter-grammar/client-query-builder'");
  });

  it('generates number type', () => {
    const output = generateFile('Users', {
      fields: {
        age: { operators: ['>=', '<='], type: 'number' },
      },
      sortable: [],
    });
    expect(output).toContain("field<number>('age'");
  });

  it('generates boolean type', () => {
    const output = generateFile('Users', {
      fields: {
        active: { operators: ['='], type: 'boolean' },
      },
      sortable: [],
    });
    expect(output).toContain("field<boolean>('active'");
  });

  it('generates enum type with union', () => {
    const output = generateFile('Users', {
      fields: {
        status: { operators: ['='], type: 'enum', values: ['active', 'inactive'] },
      },
      sortable: [],
    });
    expect(output).toContain("field<'active' | 'inactive'>('status'");
  });

  it('generates numeric enum type', () => {
    const output = generateFile('Users', {
      fields: {
        priority: { operators: ['='], type: 'enum', values: [0, 1, 2] },
      },
      sortable: [],
    });
    expect(output).toContain("field<0 | 1 | 2>('priority'");
  });

  it('omits SortX when no sortable fields', () => {
    const output = generateFile('Users', {
      fields: { name: { operators: ['='], type: 'string' } },
      sortable: [],
    });
    expect(output).not.toContain('SortUsers');
  });
});

describe('generateBarrel', () => {
  it('generates index with all exports', () => {
    const output = generateBarrel([
      { filename: 'users', hasFilter: true, hasSort: true, name: 'Users' },
      { filename: 'orders', hasFilter: true, hasSort: false, name: 'Orders' },
    ]);
    expect(output).toContain("export { FilterUsers, SortUsers } from './users'");
    expect(output).toContain("export { FilterOrders } from './orders'");
  });
});
