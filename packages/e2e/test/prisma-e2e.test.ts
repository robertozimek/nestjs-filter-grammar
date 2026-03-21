import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { parseFilter, parseSortString, FilterOperator } from '@nestjs-filter-grammar/core';
import { applyFilter, applySort, ApplyFilterOptions } from '@nestjs-filter-grammar/prisma';

/**
 * The filter grammar always produces string values. Prisma requires
 * typed values (Int for integer fields). This column map coerces
 * numeric fields to numbers — which is what real users would do.
 */
const filterOptions: ApplyFilterOptions = {
  columnMap: {
    age: (operator, values) => {
      const opMap: Record<string, string> = {
        [FilterOperator.eq]: 'equals',
        [FilterOperator.neq]: 'not',
        [FilterOperator.gt]: 'gt',
        [FilterOperator.lt]: 'lt',
        [FilterOperator.gte]: 'gte',
        [FilterOperator.lte]: 'lte',
      };
      const prismaOp = opMap[operator] ?? 'equals';
      const value = values[0].type === 'string' ? Number(values[0].value) : null;
      return { age: { [prismaOp]: value } };
    },
  },
};

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
    return prisma.user.findMany({
      where: filter ? applyFilter(parseFilter(filter), filterOptions) : undefined,
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
    // active: Charlie(35), Alice(30), then inactive: Bob(25), pending: Diana(28)
    expect(users[0].name).toBe('Charlie');
    expect(users[1].name).toBe('Alice');
  });
});
