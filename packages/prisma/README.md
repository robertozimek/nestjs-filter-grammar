# @nestjs-filter-grammar/prisma

Prisma adapter for nestjs-filter-grammar. Translates `FilterTree` and `SortEntry[]` into Prisma `where` and `orderBy` objects.

## Installation

```bash
npm install @nestjs-filter-grammar/prisma @nestjs-filter-grammar/core
```

### Peer Dependencies

- `@prisma/client` >= 5.0.0

## API

### `applyFilter(tree, options?): Record<string, PrismaQueryValue>`

Converts a `FilterTree` into a Prisma `where` object.

```typescript
import { applyFilter } from '@nestjs-filter-grammar/prisma';

const users = await prisma.user.findMany({
  where: applyFilter(filterTree),
});
```

**Output examples:**

| Input | Output |
|-------|--------|
| `status=active` | `{ status: { equals: 'active' } }` |
| `status!=deleted` | `{ status: { not: { equals: 'deleted' } } }` |
| `status=active,pending` | `{ status: { in: ['active', 'pending'] } }` |
| `name*~john` | `{ name: { contains: 'john', mode: 'insensitive' } }` |
| `status=active;age>=18` | `{ AND: [{ status: { equals: 'active' } }, { age: { gte: '18' } }] }` |
| `status=active\|status=pending` | `{ OR: [{ status: { equals: 'active' } }, { status: { equals: 'pending' } }] }` |

### `applySort(entries, options?): Record<string, PrismaQueryValue>[]`

Converts `SortEntry[]` into a Prisma `orderBy` array.

```typescript
import { applySort } from '@nestjs-filter-grammar/prisma';

const users = await prisma.user.findMany({
  orderBy: applySort(sortEntries),
});
// orderBy: [{ name: 'asc' }, { age: 'desc' }]
```

### Column Mapping

**String rename:**

```typescript
applyFilter(tree, {
  columnMap: { name: 'userName' },
});
// { userName: { equals: 'John' } }
```

**Callback for nested relations:**

```typescript
applyFilter(tree, {
  columnMap: {
    department: (operator, values) => ({
      department: { name: { equals: values[0].value } },
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
// [{ department: { name: 'asc' } }]
```

## Full Example

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async findAll(@Filter(UserQuery, { optional: true }) { filter, sort }: FilterResult) {
    return this.prisma.user.findMany({
      where: filter ? applyFilter(filter) : undefined,
      orderBy: sort ? applySort(sort) : undefined,
    });
  }
}
```
