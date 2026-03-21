import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, SelectQueryBuilder } from 'typeorm';
import { FilterOperator, FilterCondition } from '@nestjs-filter-grammar/core';
import { applyFilter } from '../src/apply-filter';

@Entity()
class TestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_name', type: 'varchar' })
  name!: string;

  @Column('varchar')
  status!: string;
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

describe('Column mapping', () => {
  it('renames column with string mapping', () => {
    const tree: FilterCondition = {
      field: 'name',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'John' }],
      fieldOffset: 0,
      operatorOffset: 4,
    };
    const result = applyFilter(qb, tree, {
      columnMap: { name: 'entity.user_name' },
    });
    const sql = result.getQuery();
    expect(sql).toContain('"entity"."user_name"');
    expect(sql).not.toContain('"entity"."name"');
  });

  it('calls callback for function mapping', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };

    let callbackCalled = false;
    applyFilter(qb, tree, {
      columnMap: {
        status: (qb, operator, values) => {
          callbackCalled = true;
          expect(operator).toBe(FilterOperator.eq);
          expect(values).toHaveLength(1);
          qb.andWhere('entity.status = :val', { val: 'active' });
        },
      },
    });

    expect(callbackCalled).toBe(true);
  });

  it('uses default column when no mapping provided', () => {
    const tree: FilterCondition = {
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    };
    const result = applyFilter(qb, tree);
    const sql = result.getQuery();
    expect(sql).toContain('"entity"."status"');
  });
});
