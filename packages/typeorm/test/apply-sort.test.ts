import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource, Entity, PrimaryGeneratedColumn, Column, SelectQueryBuilder } from 'typeorm';
import { SortDirection, SortEntry } from '@nestjs-filter-grammar/core';
import { applySort } from '../src/apply-sort';

@Entity()
class TestEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('varchar')
  name!: string;

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

describe('applySort', () => {
  it('applies ascending sort', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(qb, entries);
    const sql = result.getQuery();
    expect(sql).toContain('ORDER BY');
    expect(sql).toContain('"entity"."name"');
    expect(sql).toContain('ASC');
  });

  it('applies descending sort', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.desc }];
    const result = applySort(qb, entries);
    const sql = result.getQuery();
    expect(sql).toContain('DESC');
  });

  it('applies multiple sort fields in order', () => {
    const entries: SortEntry[] = [
      { field: 'name', direction: SortDirection.asc },
      { field: 'age', direction: SortDirection.desc },
    ];
    const result = applySort(qb, entries);
    const sql = result.getQuery();
    expect(sql).toContain('"entity"."name"');
    expect(sql).toContain('"entity"."age"');
  });

  it('applies column map rename', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(qb, entries, { columnMap: { name: 'entity.user_name' } });
    const sql = result.getQuery();
    expect(sql).toContain('entity.user_name');
  });

  it('returns the same query builder for chaining', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(qb, entries);
    expect(result).toBe(qb);
  });

  it('handles empty sort entries', () => {
    const result = applySort(qb, []);
    const sql = result.getQuery();
    expect(sql).not.toContain('ORDER BY');
  });
});
