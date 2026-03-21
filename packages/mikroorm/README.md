# @nestjs-filter-grammar/mikroorm

MikroORM adapter for nestjs-filter-grammar. Translates `FilterTree` and `SortEntry[]` into MikroORM `FilterQuery` and `QueryOrderMap` objects.

## Installation

```bash
npm install @nestjs-filter-grammar/mikroorm @nestjs-filter-grammar/core
```

### Peer Dependencies

- `@mikro-orm/core` >= 6.0.0

## API

### `applyFilter(tree, options?): Record<string, MikroOrmQueryValue>`

Converts a `FilterTree` into a MikroORM `FilterQuery` object.

```typescript
import { applyFilter } from '@nestjs-filter-grammar/mikroorm';

const users = await em.find(User, applyFilter(filterTree));
```

**Output examples:**

| Input | Output |
|-------|--------|
| `status=active` | `{ status: { $eq: 'active' } }` |
| `status!=deleted` | `{ status: { $ne: 'deleted' } }` |
| `status=active,pending` | `{ status: { $in: ['active', 'pending'] } }` |
| `name*~john` | `{ name: { $ilike: '%john%' } }` |
| `status=active;age>=18` | `{ $and: [{ status: { $eq: 'active' } }, { age: { $gte: '18' } }] }` |
| `status=active\|status=pending` | `{ $or: [{ status: { $eq: 'active' } }, { status: { $eq: 'pending' } }] }` |

### `applySort(entries, options?): Record<string, MikroOrmQueryValue>`

Converts `SortEntry[]` into a MikroORM `QueryOrderMap`.

```typescript
import { applySort } from '@nestjs-filter-grammar/mikroorm';

const users = await em.find(User, {}, { orderBy: applySort(sortEntries) });
// orderBy: { name: 'asc', age: 'desc' }
```

### Column Mapping

**String rename:**

```typescript
applyFilter(tree, {
  columnMap: { name: 'userName' },
});
// { userName: { $eq: 'John' } }
```

**Callback for nested relations:**

```typescript
applyFilter(tree, {
  columnMap: {
    department: (operator, values) => ({
      department: { name: { $eq: values[0].value } },
    }),
  },
});
```

Sort column mapping:

```typescript
applySort(entries, {
  columnMap: {
    department: (direction) => ({ department: { name: direction } }),
  },
});
// { department: { name: 'asc' } }
```

## Full Example

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly em: EntityManager) {}

  @Get()
  async findAll(@Filter(UserQuery, { optional: true }) { filter, sort }: FilterResult) {
    return this.em.find(User,
      filter ? applyFilter(filter) : {},
      { orderBy: sort ? applySort(sort) : {} },
    );
  }
}
```
