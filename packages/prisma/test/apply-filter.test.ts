import { describe, it, expect } from 'vitest';
import { FilterOperator, FilterCondition, FilterGroup } from '@nestjs-filter-grammar/core';
import { applyFilter } from '../src/apply-filter';

describe('applyFilter (Prisma)', () => {
  it('produces equals where', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ status: { equals: 'active' } });
  });

  it('produces not-equals where', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.neq,
      values: [{ type: 'string', value: 'deleted' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ status: { not: { equals: 'deleted' } } });
  });

  it('produces gte where', () => {
    const tree: FilterCondition = {
      field: 'age',
      operator: FilterOperator.gte,
      values: [{ type: 'string', value: '18' }],
      fieldOffset: 0,
      operatorOffset: 3,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ age: { gte: '18' } });
  });

  it('handles null value', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'null' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ status: { equals: null } });
  });

  it('handles multi-value with IN', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [
        { type: 'string', value: 'active' },
        { type: 'string', value: 'pending' },
      ],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ status: { in: ['active', 'pending'] } });
  });

  it('handles multi-value with null mixed in', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [
        { type: 'null' },
        { type: 'string', value: 'active' },
      ],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({
      OR: [
        { status: { equals: 'active' } },
        { status: { equals: null } },
      ],
    });
  });

  it('produces contains where', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.contains,
      values: [{ type: 'string', value: 'john' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ name: { contains: 'john' } });
  });

  it('produces case-insensitive contains', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.iContains,
      values: [{ type: 'string', value: 'john' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const where = applyFilter(tree);
    expect(where).toEqual({ name: { contains: 'john', mode: 'insensitive' } });
  });

  it('produces AND group', () => {
    const tree: FilterGroup = {
      type: 'AND',
      conditions: [
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
        { field: 'age', operator: FilterOperator.gte, values: [{ type: 'string', value: '18' }], fieldOffset: 14, operatorOffset: 17 },
      ],
    };
    const where = applyFilter(tree);
    expect(where).toEqual({
      AND: [
        { status: { equals: 'active' } },
        { age: { gte: '18' } },
      ],
    });
  });

  it('produces OR group', () => {
    const tree: FilterGroup = {
      type: 'OR',
      conditions: [
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'pending' }], fieldOffset: 14, operatorOffset: 20 },
      ],
    };
    const where = applyFilter(tree);
    expect(where).toEqual({
      OR: [
        { status: { equals: 'active' } },
        { status: { equals: 'pending' } },
      ],
    });
  });

  it('produces nested AND/OR', () => {
    const tree: FilterGroup = {
      type: 'OR',
      conditions: [
        {
          type: 'AND',
          conditions: [
            { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
            { field: 'age', operator: FilterOperator.gte, values: [{ type: 'string', value: '18' }], fieldOffset: 14, operatorOffset: 17 },
          ],
        },
        { field: 'name', operator: FilterOperator.eq, values: [{ type: 'string', value: 'admin' }], fieldOffset: 21, operatorOffset: 25 },
      ],
    };
    const where = applyFilter(tree);
    expect(where).toHaveProperty('OR');
    expect((where as any).OR).toHaveLength(2);
    expect((where as any).OR[0]).toHaveProperty('AND');
  });
});
