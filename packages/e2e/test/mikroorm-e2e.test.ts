import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { MikroORM, Entity as MikroEntity, PrimaryKey, Property } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/better-sqlite';
import { parseFilter, parseSortString } from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '@nestjs-filter-grammar/mikroorm';

// --- Entity ---

@MikroEntity()
class User {
  @PrimaryKey({ type: 'integer' })
  id!: number;

  @Property({ type: 'string' })
  name!: string;

  @Property({ type: 'string' })
  status!: string;

  @Property({ type: 'integer' })
  age!: number;

  @Property({ type: 'string', nullable: true })
  email?: string | null;
}

// --- Tests ---

describe('MikroORM E2E — SQLite', () => {
  let orm: MikroORM;

  beforeAll(async () => {
    orm = await MikroORM.init(defineConfig({
      dbName: ':memory:',
      entities: [User],
      allowGlobalContext: true,
    }));
    await orm.schema.createSchema();

    const em = orm.em.fork();
    em.create(User, { id: 1, name: 'Alice', status: 'active', age: 30, email: 'alice@test.com' });
    em.create(User, { id: 2, name: 'Bob', status: 'inactive', age: 25, email: null });
    em.create(User, { id: 3, name: 'Charlie', status: 'active', age: 35, email: 'charlie@test.com' });
    em.create(User, { id: 4, name: 'Diana', status: 'pending', age: 28, email: 'diana@test.com' });
    await em.flush();
  });

  afterAll(async () => {
    await orm?.close(true);
  });

  async function query(filter?: string, sort?: string) {
    const em = orm.em.fork();
    const filterTree = filter ? parseFilter(filter) : undefined;
    const sortEntries = sort ? parseSortString(sort) : undefined;
    return em.find(User,
      filterTree ? applyFilter(filterTree) : {},
      { orderBy: sortEntries ? applySort(sortEntries) : {} },
    );
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

  it('filters with comparison operators', async () => {
    const users = await query('age>28;age<35');
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Alice');
  });

  it('filters with null value', async () => {
    const users = await query('email=null');
    expect(users).toHaveLength(1);
    expect(users[0].name).toBe('Bob');
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
