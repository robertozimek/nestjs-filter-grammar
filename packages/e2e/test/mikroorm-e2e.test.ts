import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Module, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { MikroORM, Entity as MikroEntity, PrimaryKey, Property, EntityManager } from '@mikro-orm/core';
import { defineConfig } from '@mikro-orm/better-sqlite';
import {
  Filterable,
  FilterableColumn,
  SortableColumn,
  FilterOperator,
  Filter,
  FilterResult,
} from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '@nestjs-filter-grammar/mikroorm';

// --- ORM Entity ---

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

// --- Filter Query DTO ---

@Filterable()
class UserQuery {
  @FilterableColumn([FilterOperator.eq, FilterOperator.neq])
  @SortableColumn()
  name!: string;

  @FilterableColumn([FilterOperator.eq, FilterOperator.neq])
  @SortableColumn()
  status!: string;

  @FilterableColumn([FilterOperator.eq, FilterOperator.gte, FilterOperator.lte, FilterOperator.gt, FilterOperator.lt], { type: 'number' })
  @SortableColumn()
  age!: number;

  @FilterableColumn([FilterOperator.eq])
  email!: string;
}

// --- NestJS Controller + Module ---

let orm: MikroORM;

@Controller('users')
class UsersController {
  @Get()
  async findAll(@Filter(UserQuery, { optional: true }) { filter, sort }: FilterResult) {
    const em = orm.em.fork();
    return em.find(User,
      filter ? applyFilter(filter) : {},
      { orderBy: sort ? applySort(sort) : {} },
    );
  }
}

@Module({ controllers: [UsersController] })
class AppModule {}

// --- Tests ---

describe('MikroORM E2E — NestJS + SQLite', () => {
  let app: INestApplication;

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

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await orm?.close(true);
  });

  it('returns all users without filter', async () => {
    const res = await request(app.getHttpServer()).get('/users').expect(200);
    expect(res.body).toHaveLength(4);
  });

  it('filters by equality', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=status=active').expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body.every((u: { status: string }) => u.status === 'active')).toBe(true);
  });

  it('filters by not-equals', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=status!=active').expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters with AND (semicolon)', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=status=active;age>=30').expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters with OR (pipe)', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=status=active|status=pending').expect(200);
    expect(res.body).toHaveLength(3);
  });

  it('filters with multi-value IN (comma)', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=status=active,pending').expect(200);
    expect(res.body).toHaveLength(3);
  });

  it('filters with comparison operators', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=age>28;age<35').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Alice');
  });

  it('filters with null value', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=email=null').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Bob');
  });

  it('sorts ascending', async () => {
    const res = await request(app.getHttpServer()).get('/users?sort=+age').expect(200);
    expect(res.body[0].name).toBe('Bob');
    expect(res.body[3].name).toBe('Charlie');
  });

  it('sorts descending', async () => {
    const res = await request(app.getHttpServer()).get('/users?sort=-age').expect(200);
    expect(res.body[0].name).toBe('Charlie');
    expect(res.body[3].name).toBe('Bob');
  });

  it('filters and sorts together', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=status=active&sort=-age').expect(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Charlie');
    expect(res.body[1].name).toBe('Alice');
  });

  it('returns 400 for unknown field', async () => {
    await request(app.getHttpServer()).get('/users?filter=unknown=value').expect(400);
  });

  it('returns 400 for invalid number value', async () => {
    await request(app.getHttpServer()).get('/users?filter=age>=abc').expect(400);
  });
});
