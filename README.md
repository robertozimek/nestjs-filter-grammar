# nestjs-filter-grammar

A filter and sort DSL for NestJS APIs. Declare filterable columns with decorators, parse filter strings from query parameters, and translate them into TypeORM, Prisma, or MikroORM queries.

## Packages

| Package | Description |
|---------|-------------|
| [`@nestjs-filter-grammar/core`](./packages/core) | Grammar parser, decorators, validation, Swagger generation |
| [`@nestjs-filter-grammar/typeorm`](./packages/typeorm) | TypeORM `SelectQueryBuilder` adapter |
| [`@nestjs-filter-grammar/prisma`](./packages/prisma) | Prisma `where`/`orderBy` adapter |
| [`@nestjs-filter-grammar/mikroorm`](./packages/mikroorm) | MikroORM `FilterQuery`/`QueryOrderMap` adapter |

## Quick Start

### 1. Install

```bash
# Core (always required)
npm install @nestjs-filter-grammar/core

# Pick your ORM adapter
npm install @nestjs-filter-grammar/typeorm
# or
npm install @nestjs-filter-grammar/prisma
# or
npm install @nestjs-filter-grammar/mikroorm
```

### 2. Define filterable columns

```typescript
import {
  Filterable,
  FilterableColumn,
  SortableColumn,
  FilterOperator,
} from '@nestjs-filter-grammar/core';

enum Status { active = 'active', inactive = 'inactive', pending = 'pending' }

@Filterable()
class UserQuery {
  @FilterableColumn([FilterOperator.eq, FilterOperator.neq, FilterOperator.iContains])
  @SortableColumn()
  name!: string;

  @FilterableColumn([FilterOperator.eq, FilterOperator.neq], { type: Status })
  @SortableColumn()
  status!: Status;

  @FilterableColumn([FilterOperator.gte, FilterOperator.lte], { type: 'number' })
  @SortableColumn()
  age!: number;
}
```

### 3. Use the `@Filter()` decorator in your controller

```typescript
import { Controller, Get } from '@nestjs/common';
import { Filter, FilterResult } from '@nestjs-filter-grammar/core';

@Controller('users')
export class UsersController {
  @Get()
  findAll(@Filter(UserQuery) { filter, sort, query }: FilterResult) {
    // filter: parsed FilterTree (or undefined)
    // sort:   parsed SortEntry[] (or undefined)
    // query:  remaining query params
  }
}
```

### 4. Apply to your ORM

**TypeORM:**
```typescript
import { applyFilter, applySort } from '@nestjs-filter-grammar/typeorm';

const qb = repo.createQueryBuilder('user');
if (filter) applyFilter(qb, filter);
if (sort) applySort(qb, sort);
const users = await qb.getMany();
```

**Prisma:**
```typescript
import { applyFilter, applySort } from '@nestjs-filter-grammar/prisma';

const users = await prisma.user.findMany({
  where: filter ? applyFilter(filter) : undefined,
  orderBy: sort ? applySort(sort) : undefined,
});
```

**MikroORM:**
```typescript
import { applyFilter, applySort } from '@nestjs-filter-grammar/mikroorm';

const users = await em.find(User,
  filter ? applyFilter(filter) : {},
  { orderBy: sort ? applySort(sort) : {} },
);
```

## Grammar Reference

Filter strings use this grammar:

```
filter     → or_expr
or_expr    → and_expr ( "|" and_expr )*
and_expr   → condition ( ";" condition )*
condition  → field operator values
values     → value ( "," value )*
value      → TOKEN | STRING_LITERAL | "null"
```

### Operators

| Operator | Symbol | Example |
|----------|--------|---------|
| Equals | `=` | `status=active` |
| Not equals | `!=` | `status!=deleted` |
| Greater than | `>` | `age>18` |
| Less than | `<` | `age<65` |
| Greater or equal | `>=` | `age>=21` |
| Less or equal | `<=` | `age<=30` |
| Case-insensitive equals | `~` | `name~john` |
| Case-insensitive not equals | `!~` | `name!~admin` |
| Starts with | `^=` | `name^=Jo` |
| Ends with | `$=` | `name$=son` |
| Contains | `*=` | `name*=oh` |
| Starts with (case-insensitive) | `^~` | `name^~jo` |
| Ends with (case-insensitive) | `$~` | `name$~SON` |
| Contains (case-insensitive) | `*~` | `name*~OH` |

### Combining Conditions

- **AND** (semicolon): `status=active;age>=18`
- **OR** (pipe): `status=active|status=pending`
- **Multi-value / IN** (comma): `status=active,pending`
- **Null**: `status=null`
- **Quoted values**: `name="hello world"`

### Sort Syntax

Sort strings use `+field` (ascending, default) or `-field` (descending), comma-separated:

```
sort=+name,-age     → ORDER BY name ASC, age DESC
sort=name,-age      → ORDER BY name ASC, age DESC (+ is optional)
```

## License

MIT
