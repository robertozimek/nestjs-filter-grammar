# nestjs-filter-grammar

A filter and sort DSL for NestJS APIs. Declare filterable columns with decorators, parse filter strings from query parameters, and translate them into TypeORM, Prisma, or MikroORM queries. Includes a client-side query builder with OpenAPI codegen for type-safe filter construction.

## Packages

| Package | Description |
|---------|-------------|
| [`@nestjs-filter-grammar/core`](./packages/core) | Grammar parser, decorators, validation, Swagger + OpenAPI extensions |
| [`@nestjs-filter-grammar/typeorm`](./packages/typeorm) | TypeORM `SelectQueryBuilder` adapter |
| [`@nestjs-filter-grammar/prisma`](./packages/prisma) | Prisma `where`/`orderBy` adapter |
| [`@nestjs-filter-grammar/mikroorm`](./packages/mikroorm) | MikroORM `FilterQuery`/`QueryOrderMap` adapter |
| [`@nestjs-filter-grammar/client-query-builder`](./packages/client-query-builder) | Type-safe client query builder with OpenAPI codegen |

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

## Client Query Builder

Generate type-safe filter builders from your API's OpenAPI spec.

### Install

```bash
npm install @nestjs-filter-grammar/client-query-builder
```

### Generate from OpenAPI spec

```bash
npx filter-grammar generate ./openapi.json -o ./src/generated
```

This reads `x-filter-grammar` extensions from the spec (automatically added by `@Filter()` when `@nestjs/swagger` is installed) and generates typed filter/sort objects.

### Usage

```typescript
import { and, or, sort } from '@nestjs-filter-grammar/client-query-builder';
import { FilterUsers, SortUsers } from './generated';

// Simple filter
const filter = FilterUsers.name.eq('John').build();
// → "name=John"

// Multi-value (IN)
const filter = FilterUsers.status.eq('active', 'pending').build();
// → "status=active,pending"

// Null
const filter = FilterUsers.email.eq(null).build();
// → "email=null"

// Combine with and/or
const filter = and(
  FilterUsers.name.eq('John'),
  or(
    FilterUsers.status.eq('active'),
    FilterUsers.status.eq('pending'),
  ),
  FilterUsers.age.gte(18),
).build();
// → "name=John;(status=active|status=pending);age>=18"

// Sort
const sortStr = sort(
  SortUsers.name.asc(),
  SortUsers.age.desc(),
).build();
// → "+name,-age"

// Use with fetch
fetch(`/api/users?filter=${filter}&sort=${sortStr}`);
```

## Grammar Reference

Filter strings use this grammar:

```
filter     → or_expr
or_expr    → and_expr ( "|" and_expr )*
and_expr   → atom ( ";" atom )*
atom       → condition | "(" or_expr ")"
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
- **Grouping** (parentheses): `(status=active|status=pending);age>=18`
- **Multi-value / IN** (comma): `status=active,pending`
- **Null**: `status=null`
- **Quoted values**: `name="hello world"` (preserves commas, spaces, special chars)

### Sort Syntax

Sort strings use `+field` (ascending, default) or `-field` (descending), comma-separated:

```
sort=+name,-age     → ORDER BY name ASC, age DESC
sort=name,-age      → ORDER BY name ASC, age DESC (+ is optional)
```

## License

MIT
