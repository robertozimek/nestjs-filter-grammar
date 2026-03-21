import 'reflect-metadata';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Controller, Get, Module, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Filter } from '../src/param/filter.decorator';
import { Filterable } from '../src/decorators/filterable.decorator';
import { FilterableColumn } from '../src/decorators/filterable-column.decorator';
import { SortableColumn } from '../src/decorators/sortable-column.decorator';
import { FilterOperator, FilterResult } from '../src/types';

@Filterable()
class UserQuery {
  @FilterableColumn([FilterOperator.eq, FilterOperator.neq])
  status!: string;

  @FilterableColumn([FilterOperator.eq, FilterOperator.gte, FilterOperator.lte])
  age!: number;
}

@Filterable()
class FullQuery extends UserQuery {
  includeChildren!: boolean;
}

@Filterable()
class SortableQuery extends UserQuery {
  @SortableColumn()
  @FilterableColumn([FilterOperator.eq, FilterOperator.iContains])
  name!: string;

  @SortableColumn()
  createdAt!: string;
}

@Controller('test')
class TestController {
  @Get('basic')
  basic(@Filter(UserQuery) result: FilterResult<UserQuery>) {
    return result;
  }

  @Get('full')
  full(@Filter(FullQuery) result: FilterResult<FullQuery>) {
    return result;
  }

  @Get('optional')
  optional(@Filter(UserQuery, { optional: true }) result: FilterResult<UserQuery>) {
    return result;
  }

  @Get('custom-param')
  customParam(@Filter(UserQuery, { queryParam: 'q' }) result: FilterResult<UserQuery>) {
    return result;
  }

  @Get('sortable')
  sortable(@Filter(SortableQuery) result: FilterResult<SortableQuery>) {
    return result;
  }

  @Get('optional-sort')
  optionalSort(@Filter(SortableQuery, { optional: true }) result: FilterResult<SortableQuery>) {
    return result;
  }

  @Get('custom-sort')
  customSort(@Filter(SortableQuery, { sortParam: 'order' }) result: FilterResult<SortableQuery>) {
    return result;
  }
}

@Module({ controllers: [TestController] })
class TestModule {}

describe('@Filter() parameter decorator', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('parses a valid filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/basic?filter=status=active')
      .expect(200);

    expect(res.body.filter).toMatchObject({
      field: 'status',
      operator: '=',
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    });
  });

  it('returns 400 for unknown field', async () => {
    await request(app.getHttpServer())
      .get('/test/basic?filter=unknown=value')
      .expect(400);
  });

  it('returns 400 for disallowed operator', async () => {
    await request(app.getHttpServer())
      .get('/test/basic?filter=status>=active')
      .expect(400);
  });

  it('returns 400 for malformed filter', async () => {
    await request(app.getHttpServer())
      .get('/test/basic?filter==value')
      .expect(400);
  });

  it('returns filter undefined when filter param is missing and optional', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/optional')
      .expect(200);

    expect(res.body.filter).toBeUndefined();
  });

  it('returns 400 when filter param is missing and not optional', async () => {
    await request(app.getHttpServer())
      .get('/test/basic')
      .expect(400);
  });

  it('returns filter undefined for empty filter string when optional', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/optional?filter=')
      .expect(200);

    expect(res.body.filter).toBeUndefined();
  });

  it('populates query with non-filter params', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/full?filter=status=active&includeChildren=true')
      .expect(200);

    expect(res.body.filter).toBeDefined();
    expect(res.body.query).toBeDefined();
    expect(res.body.query.includeChildren).toBe('true');
  });

  it('uses custom query param name', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/custom-param?q=status=active')
      .expect(200);

    expect(res.body.filter).toBeDefined();
  });

  it('parses sort parameter', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/sortable?filter=status=active&sort=+name,-createdAt')
      .expect(200);
    expect(res.body.sort).toEqual([
      { field: 'name', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' },
    ]);
  });

  it('returns sort undefined when sort param is missing', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/sortable?filter=status=active')
      .expect(200);
    expect(res.body.sort).toBeUndefined();
  });

  it('returns 400 for unknown sort field', async () => {
    await request(app.getHttpServer())
      .get('/test/sortable?filter=status=active&sort=+unknown')
      .expect(400);
  });

  it('returns 400 for duplicate sort fields', async () => {
    await request(app.getHttpServer())
      .get('/test/sortable?filter=status=active&sort=+name,-name')
      .expect(400);
  });

  it('works with sort only (optional filter)', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/optional-sort?sort=-name')
      .expect(200);
    expect(res.body.sort).toEqual([
      { field: 'name', direction: 'desc' },
    ]);
    expect(res.body.filter).toBeUndefined();
  });

  it('uses custom sort param name', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/custom-sort?filter=status=active&order=+name')
      .expect(200);
    expect(res.body.sort).toEqual([
      { field: 'name', direction: 'asc' },
    ]);
  });

  it('ignores sort param when no @SortableColumn decorators exist', async () => {
    const res = await request(app.getHttpServer())
      .get('/test/basic?filter=status=active&sort=+anything')
      .expect(200);
    expect(res.body.sort).toBeUndefined();
  });
});
