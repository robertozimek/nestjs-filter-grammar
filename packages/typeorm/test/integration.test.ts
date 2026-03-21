import 'reflect-metadata';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { parseFilter, SortDirection } from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '../src';

@Entity()
class User {
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

beforeEach(async () => {
  ds = new DataSource({
    type: 'sqljs',
    dropSchema: true,
    entities: [User],
    synchronize: true,
  });
  await ds.initialize();

  const repo = ds.getRepository(User);
  await repo.save([
    { name: 'Alice', status: 'active', age: 30 },
    { name: 'Bob', status: 'inactive', age: 25 },
    { name: 'Charlie', status: 'active', age: 35 },
    { name: 'Diana', status: 'pending', age: 28 },
  ]);
});

afterEach(async () => {
  await ds?.destroy();
});

describe('TypeORM adapter integration', () => {
  it('filters and returns correct results', async () => {
    const tree = parseFilter('status=active');
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applyFilter(qb, tree);

    const results = await qb.getMany();
    expect(results).toHaveLength(2);
    expect(results.every((u) => u.status === 'active')).toBe(true);
  });

  it('filters with AND', async () => {
    const tree = parseFilter('status=active;age>=30');
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applyFilter(qb, tree);

    const results = await qb.getMany();
    expect(results).toHaveLength(2);
  });

  it('filters with OR', async () => {
    const tree = parseFilter('status=active|status=pending');
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applyFilter(qb, tree);

    const results = await qb.getMany();
    expect(results).toHaveLength(3);
  });

  it('filters with multi-value IN', async () => {
    const tree = parseFilter('status=active,pending');
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applyFilter(qb, tree);

    const results = await qb.getMany();
    expect(results).toHaveLength(3);
  });

  it('sorts results', async () => {
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applySort(qb, [{ field: 'age', direction: SortDirection.asc }]);

    const results = await qb.getMany();
    expect(results[0].name).toBe('Bob');
    expect(results[results.length - 1].name).toBe('Charlie');
  });

  it('filters and sorts together', async () => {
    const tree = parseFilter('status=active');
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applyFilter(qb, tree);
    applySort(qb, [{ field: 'age', direction: SortDirection.desc }]);

    const results = await qb.getMany();
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('Charlie');
    expect(results[1].name).toBe('Alice');
  });

  it('contains-insensitive search works', async () => {
    const tree = parseFilter('name*~li');
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    applyFilter(qb, tree);

    const results = await qb.getMany();
    expect(results).toHaveLength(2); // Alice, Charlie
  });
});
