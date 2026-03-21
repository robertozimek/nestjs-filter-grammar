import { describe, it, expect } from 'vitest';
import { FilterOperator, FilterCondition } from '@nestjs-filter-grammar/core';
import { applyFilter } from '../src/apply-filter';

describe('Column mapping (MikroORM)', () => {
  it('renames column with string mapping', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'John' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const query = applyFilter(tree, { columnMap: { name: 'userName' } });
    expect(query).toEqual({ userName: { $eq: 'John' } });
  });

  it('calls callback for function mapping', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const query = applyFilter(tree, {
      columnMap: {
        status: (operator, values) => ({
          profile: { status: { $eq: 'active' } },
        }),
      },
    });
    expect(query).toHaveProperty('profile');
  });
});
