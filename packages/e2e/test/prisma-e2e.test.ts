import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { parseFilter, parseSortString, coerceFilterValues, FilterOperator, ColumnMetadata } from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '@nestjs-filter-grammar/prisma';

const columnMetadata: ColumnMetadata[] = [
  { propertyKey: 'name', operators: [FilterOperator.eq, FilterOperator.iContains, FilterOperator.startsWith], valueType: 'string' },
  { propertyKey: 'status', operators: [FilterOperator.eq, FilterOperator.neq], valueType: 'string' },
  { propertyKey: 'age', operators: [FilterOperator.eq, FilterOperator.gte, FilterOperator.lte, FilterOperator.gt, FilterOperator.lt], valueType: 'number' },
  { propertyKey: 'email', operators: [FilterOperator.eq], valueType: 'string' },
];

describe('Prisma E2E — SQLite', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient({
      datasourceUrl: 'file:./test.db',
    });

    // Clean and seed
    await prisma.user.deleteMany();
    await prisma.user.createMany({
      data: [
        { name: 'Alice', status: 'active', age: 30, email: 'alice@test.com' },
        { name: 'Bob', status: 'inactive', age: 25, email: null },
        { name: 'Charlie', status: 'active', age: 35, email: 'charlie@test.com' },
        { name: 'Diana', status: 'pending', age: 28, email: 'diana@test.com' },
      ],
    });
  });

  afterAll(async () => {
    await prisma?.$disconnect();
  });

  async function query(filter?: string, sort?: string) {
    let filterTree;
    if (filter) {
      const parsed = parseFilter(filter);
      const { tree } = coerceFilterValues(parsed, columnMetadata);
      filterTree = tree;
    }
    return prisma.user.findMany({
      where: filterTree ? applyFilter(filterTree) : undefined,
      orderBy: sort ? applySort(parseSortString(sort)) : undefined,
    });
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
    expect(users[0].name).toBe('Charlie');
    expect(users[1].name).toBe('Alice');
  });
});
