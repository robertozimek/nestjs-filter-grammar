import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, SelectQueryBuilder } from 'typeorm';
import { FilterOperator, FilterCondition, FilterGroup } from '@nestjs-filter-grammar/core';
import { applyFilter } from '../src/apply-filter';

@Entity()
class TestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar')
  name!: string;

  @Column('varchar')
  status!: string;

  @Column('int')
  age!: number;
}

let ds: DataSource;
let qb: SelectQueryBuilder<TestEntity>;

beforeEach(async () => {
  ds = new DataSource({
    type: 'sqljs',
    dropSchema: true,
    entities: [TestEntity],
    synchronize: true,
  });
  await ds.initialize();
  qb = ds.getRepository(TestEntity).createQueryBuilder('entity');
});

afterEach(async () => {
  await ds?.destroy();
});

describe('applyFilter', () => {
  it('applies a simple equality condition', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('"entity"."status" = :');
  });

  it('applies not-equals condition', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.neq,
      values: [{ type: 'string', value: 'deleted' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('"entity"."status" != :');
  });

  it('handles null value with IS NULL', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'null' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('IS NULL');
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
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('IN');
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
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('IS NULL');
    expect(sql).toContain('OR');
  });

  it('applies LIKE for startsWith', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.startsWith,
      values: [{ type: 'string', value: 'John' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('LIKE');
  });

  it('applies case-insensitive contains with LOWER', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.iContains,
      values: [{ type: 'string', value: 'john' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('LOWER');
    expect(sql).toContain('LIKE');
  });

  it('applies AND group', () => {
    const tree: FilterGroup = {
      type: 'AND',
      conditions: [
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
        { field: 'age', operator: FilterOperator.gte, values: [{ type: 'string', value: '18' }], fieldOffset: 14, operatorOffset: 17 },
      ],
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('"entity"."status"');
    expect(sql).toContain('"entity"."age"');
  });

  it('applies OR group', () => {
    const tree: FilterGroup = {
      type: 'OR',
      conditions: [
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'active' }], fieldOffset: 0, operatorOffset: 6 },
        { field: 'status', operator: FilterOperator.eq, values: [{ type: 'string', value: 'pending' }], fieldOffset: 14, operatorOffset: 20 },
      ],
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('OR');
  });

  it('applies nested AND/OR', () => {
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
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('OR');
  });

  it('returns the same query builder for chaining', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const result = applyFilter(qb, tree);
    expect(result).toBe(qb);
  });
});
