import { describe, it, expect } from 'vitest';
import { FilterOperator, FilterCondition, FilterGroup } from '@nestjs-filter-grammar/core';
import { applyFilter } from '../src/apply-filter';

describe('applyFilter (MikroORM)', () => {
  it('produces $eq query', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const query = applyFilter(tree);
    expect(query).toEqual({ status: { $eq: 'active' } });
  });

  it('produces $ne query', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.neq,
      values: [{ type: 'string', value: 'deleted' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const query = applyFilter(tree);
    expect(query).toEqual({ status: { $ne: 'deleted' } });
  });

  it('produces $gte query', () => {
    const tree: FilterCondition = {
      field: 'age',
      operator: FilterOperator.gte,
      values: [{ type: 'string', value: '18' }],
      fieldOffset: 0,
      operatorOffset: 3,
    };
    const query = applyFilter(tree);
    expect(query).toEqual({ age: { $gte: '18' } });
  });

  it('handles null value', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'null' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const query = applyFilter(tree);
    expect(query).toEqual({ status: { $eq: null } });
  });

  it('handles multi-value with $in', () => {
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
    const query = applyFilter(tree);
    expect(query).toEqual({ status: { $in: ['active', 'pending'] } });
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
    const query = applyFilter(tree);
    expect(query).toEqual({
      $or: [
        { status: { $eq: 'active' } },
        { status: { $eq: null } },
      ],
    });
  });

  it('produces $like query for contains', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.contains,
      values: [{ type: 'string', value: 'john' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const query = applyFilter(tree);
    expect(query).toEqual({ name: { $like: '%john%' } });
  });

  it('produces $ilike for case-insensitive contains', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.iContains,
      values: [{ type: 'string', value: 'john' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const query = applyFilter(tree);
    expect(query).toEqual({ name: { $ilike: '%john%' } });
  });

  it('produces $and group', () => {
    const tree: FilterGroup = {
      type: 'AND',
      conditions: [
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
        { field: 'age', operator: FilterOperator.gte, values: [{ type: 'string', value: '18' }], fieldOffset: 14, operatorOffset: 17 },
      ],
    };
    const query = applyFilter(tree);
    expect(query).toEqual({
      $and: [
        { status: { $eq: 'active' } },
        { age: { $gte: '18' } },
      ],
    });
  });

  it('produces $or group', () => {
    const tree: FilterGroup = {
      type: 'OR',
      conditions: [
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'pending' }], fieldOffset: 14, operatorOffset: 20 },
      ],
    };
    const query = applyFilter(tree);
    expect(query).toEqual({
      $or: [
        { status: { $eq: 'active' } },
        { status: { $eq: 'pending' } },
      ],
    });
  });
});
