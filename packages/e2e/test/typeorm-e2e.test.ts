import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { parseFilter, parseSortString, coerceFilterValues, FilterOperator, ColumnMetadata } from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '@nestjs-filter-grammar/typeorm';

const columnMetadata: ColumnMetadata[] = [
  { propertyKey: 'name', operators: [FilterOperator.eq, FilterOperator.iContains, FilterOperator.startsWith], valueType: 'string' },
  { propertyKey: 'status', operators: [FilterOperator.eq, FilterOperator.neq], valueType: 'string' },
  { propertyKey: 'age', operators: [FilterOperator.eq, FilterOperator.gte, FilterOperator.lte, FilterOperator.gt, FilterOperator.lt], valueType: 'number' },
  { propertyKey: 'email', operators: [FilterOperator.eq], valueType: 'string' },
];

// --- Entity ---

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

  @Column('varchar', { nullable: true })
  email!: string | null;
}

// --- Tests ---

describe('TypeORM E2E — SQLite', () => {
  let ds: DataSource;

  beforeAll(async () => {
    ds = new DataSource({
      type: 'sqljs',
      dropSchema: true,
      entities: [User],
      synchronize: true,
    });
    await ds.initialize();

    await ds.getRepository(User).save([
      { name: 'Alice', status: 'active', age: 30, email: 'alice@test.com' },
      { name: 'Bob', status: 'inactive', age: 25, email: null },
      { name: 'Charlie', status: 'active', age: 35, email: 'charlie@test.com' },
      { name: 'Diana', status: 'pending', age: 28, email: 'diana@test.com' },
    ]);
  });

  afterAll(async () => {
    await ds?.destroy();
  });

  async function query(filter?: string, sort?: string) {
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    if (filter) {
      const parsed = parseFilter(filter);
      const { tree } = coerceFilterValues(parsed, columnMetadata);
      applyFilter(qb, tree);
    }
    if (sort) applySort(qb, parseSortString(sort));
    return qb.getMany();
  }

  it('returns all users without filter', async () => {
    const users = await query();
    expect(users).toHaveLength(4);
  });

  it('filters by equality', async () => {
    const users = await query('status=active');
    expect(users).toHaveLength(2);
    expect(users.every((u) => u.status === 'active')).toBe(true);
  });

  it('filters by not-equals', async () => {
    const users = await query('status!=active');
    expect(users).toHaveLength(2);
    expect(users.every((u) => u.status !== 'active')).toBe(true);
  });

  it('filters with AND (semicolon)', async () => {
    const users = await query('status=active;age>=30');
    expect(users).toHaveLength(2);
    expect(users.every((u) => u.status === 'active' && u.age >= 30)).toBe(true);
  });

  it('filters with OR (pipe)', async () => {
    const users = await query('status=active|status=pending');
    expect(users).toHaveLength(3);
  });

  it('filters with multi-value IN (comma)', async () => {
    const users = await query('status=active,pending');
    expect(users).toHaveLength(3);
  });

  it('filters with case-insensitive contains', async () => {
    const users = await query('name*~li');
    expect(users).toHaveLength(2); // Alice, Charlie
  });

  it('filters with startsWith', async () => {
    const users = await query('name^=Ch');
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Charlie');
  });

  it('filters with null value', async () => {
    const users = await query('email=null');
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Bob');
  });

  it('filters with comparison operators', async () => {
    const users = await query('age>28;age<35');
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
  });

  it('sorts ascending', async () => {
    const users = await query(undefined, '+age');
    expect(users[0].name).toBe('Bob');
    expect(users[3].name).toBe('Charlie');
  });

  it('sorts descending', async () => {
    const users = await query(undefined, '-age');
    expect(users[0].name).toBe('Charlie');
    expect(users[3].name).toBe('Bob');
  });

  it('filters and sorts together', async () => {
    const users = await query('status=active', '-age');
    expect(users).toHaveLength(2);
    expect(users[0].name).toBe('Charlie');
    expect(users[1].name).toBe('Alice');
  });

  it('sorts by multiple fields', async () => {
    const users = await query(undefined, '+status,-age');
    // active: Charlie(35), Alice(30), then inactive: Bob(25), pending: Diana(28)
    expect(users[0].name).toBe('Charlie');
    expect(users[1].name).toBe('Alice');
  });
});
