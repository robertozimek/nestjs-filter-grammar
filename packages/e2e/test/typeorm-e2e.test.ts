import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Module, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { DataSource, Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import {
  Filterable,
  FilterableColumn,
  SortableColumn,
  FilterOperator,
  Filter,
  FilterResult,
} from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '@nestjs-filter-grammar/typeorm';

// --- ORM Entity ---

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

// --- Filter Query DTO ---

@Filterable()
class UserQuery {
  @FilterableColumn([FilterOperator.eq, FilterOperator.neq, FilterOperator.iContains, FilterOperator.startsWith])
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

let ds: DataSource;

@Controller('users')
class UsersController {
  @Get()
  async findAll(@Filter(UserQuery, { optional: true }) { filter, sort }: FilterResult) {
    const qb = ds.getRepository(User).createQueryBuilder('entity');
    if (filter) applyFilter(qb, filter);
    if (sort) applySort(qb, sort);
    return qb.getMany();
  }
}

@Module({ controllers: [UsersController] })
class AppModule {}

// --- Tests ---

describe('TypeORM E2E — NestJS + SQLite', () => {
  let app: INestApplication;

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

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await ds?.destroy();
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
    expect(res.body.every((u: { status: string }) => u.status !== 'active')).toBe(true);
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

  it('filters with case-insensitive contains', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=name*~li').expect(200);
    expect(res.body).toHaveLength(2);
  });

  it('filters with startsWith', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=name^=Ch').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Charlie');
  });

  it('filters with null value', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=email=null').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Bob');
  });

  it('filters with comparison operators', async () => {
    const res = await request(app.getHttpServer()).get('/users?filter=age>28;age<35').expect(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].name).toBe('Alice');
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

  it('filters with parenthesized OR within AND', async () => {
    const res = await request(app.getHttpServer())
      .get('/users?filter=(status=active|status=pending);age>=28')
      .expect(200);
    // active with age>=28: Alice(30), Charlie(35). pending with age>=28: Diana(28).
    expect(res.body).toHaveLength(3);
  });

  it('returns 400 for unknown field', async () => {
    await request(app.getHttpServer()).get('/users?filter=unknown=value').expect(400);
  });

  it('returns 400 for disallowed operator', async () => {
    await request(app.getHttpServer()).get('/users?filter=status>=value').expect(400);
  });

  it('returns 400 for invalid number value', async () => {
    await request(app.getHttpServer()).get('/users?filter=age>=abc').expect(400);
  });
});
