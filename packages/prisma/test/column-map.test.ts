import { describe, it, expect } from 'vitest';
import { FilterOperator, FilterCondition } from '@nestjs-filter-grammar/core';
import { applyFilter } from '../src/apply-filter';

describe('Column mapping (Prisma)', () => {
  it('renames column with string mapping', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'John' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const where = applyFilter(tree, { columnMap: { name: 'userName' } });
    expect(where).toEqual({ userName: { equals: 'John' } });
  });

  it('calls callback for function mapping', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const where = applyFilter(tree, {
      columnMap: {
        status: (operator, values) => ({
          profile: { status: { equals: 'active' } },
        }),
      },
    });
    expect(where).toHaveProperty('profile');
  });
});
