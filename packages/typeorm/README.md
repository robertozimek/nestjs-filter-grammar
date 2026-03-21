# @nestjs-filter-grammar/typeorm

TypeORM adapter for nestjs-filter-grammar. Translates `FilterTree` and `SortEntry[]` into `SelectQueryBuilder` WHERE and ORDER BY clauses.

## Installation

```bash
npm install @nestjs-filter-grammar/typeorm @nestjs-filter-grammar/core
```

### Peer Dependencies

- `typeorm` >= 0.3.0

## API

### `applyFilter<T>(qb, tree, options?): SelectQueryBuilder<T>`

Applies a `FilterTree` to a TypeORM `SelectQueryBuilder`. Mutates and returns the same query builder for chaining.

```typescript
import { applyFilter } from '@nestjs-filter-grammar/typeorm';

const qb = repo.createQueryBuilder('user');
applyFilter(qb, filterTree);
const users = await qb.getMany();
```

### `applySort<T>(qb, entries, options?): SelectQueryBuilder<T>`

Applies `SortEntry[]` as ORDER BY clauses.

```typescript
import { applySort } from '@nestjs-filter-grammar/typeorm';

const qb = repo.createQueryBuilder('user');
applySort(qb, [{ field: 'name', direction: SortDirection.asc }]);
```

### Column Mapping

By default, field names map to `entity.fieldName`. Use `columnMap` to rename columns or provide custom query logic.

**String rename:**

```typescript
applyFilter(qb, tree, {
  columnMap: {
    name: 'entity.user_name',
  },
});
```

**Callback for full control (joins, subqueries):**

```typescript
applyFilter(qb, tree, {
  columnMap: {
    department: (qb, operator, values) => {
      qb.leftJoin('entity.department', 'dept')
        .andWhere('dept.name = :dept', { dept: values[0].value });
    },
  },
});
```

Sort column mapping works the same way:

```typescript
applySort(qb, entries, {
  columnMap: {
    name: 'entity.user_name',
    department: (qb, direction) => {
      qb.leftJoin('entity.department', 'dept')
        .addOrderBy('dept.name', direction);
    },
  },
});
```

## Full Example

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly repo: Repository<User>) {}

  @Get()
  async findAll(@Filter(UserQuery, { optional: true }) { filter, sort }: FilterResult) {
    const qb = this.repo.createQueryBuilder('entity');
    if (filter) applyFilter(qb, filter);
    if (sort) applySort(qb, sort);
    return qb.getMany();
  }
}
```
