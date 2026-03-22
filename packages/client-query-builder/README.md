# @nestjs-filter-grammar/client-query-builder

Type-safe frontend query builder for `@nestjs-filter-grammar` — build filter and sort query strings for REST APIs, designed to work alongside OpenAPI-generated clients. Generates typed filter/sort builders from your API's OpenAPI spec so your frontend stays in sync with your backend's filter grammar.

## Installation

```bash
npm install @nestjs-filter-grammar/client-query-builder
```

## Code Generation

Generate typed filter/sort builders from an OpenAPI spec that contains `x-filter-grammar` extensions (automatically added by the `@Filter()` decorator when `@nestjs/swagger` is installed).

```bash
npx filter-grammar generate ./openapi.json -o ./src/generated
```

Options:
- `-o, --output <dir>` — Output directory (default: `./src/generated`)

This generates one file per endpoint with `FilterX` and `SortX` objects, plus a barrel `index.ts`.

### Generated Output

For a `GET /users` endpoint:

```typescript
// generated/users.ts
import { field, sortField } from '@nestjs-filter-grammar/client-query-builder';

export const FilterUsers = {
  name: field<string>('name', ['=', '!=', '*~']),
  status: field<'active' | 'inactive' | 'pending'>('status', ['=', '!=']),
  age: field<number>('age', ['>=', '<=']),
} as const;

export const SortUsers = {
  name: sortField('name'),
  age: sortField('age'),
} as const;
```

## Runtime API

### Filter Conditions

```typescript
import { FilterUsers } from './generated';

// Simple equality
FilterUsers.name.eq('John').build()           // "name=John"

// Multi-value (IN)
FilterUsers.status.eq('active', 'pending').build()  // "status=active,pending"

// Null
FilterUsers.email.eq(null).build()            // "email=null"

// Comparison
FilterUsers.age.gte(18).build()               // "age>=18"

// Case-insensitive contains
FilterUsers.name.iContains('john').build()    // "name*~john"
```

### Combining with `and()` / `or()`

```typescript
import { and, or } from '@nestjs-filter-grammar/client-query-builder';

// AND
and(
  FilterUsers.name.eq('John'),
  FilterUsers.age.gte(18),
).build()
// → "name=John;age>=18"

// OR
or(
  FilterUsers.status.eq('active'),
  FilterUsers.status.eq('pending'),
).build()
// → "status=active|status=pending"

// Nested — automatically parenthesized
and(
  FilterUsers.name.eq('John'),
  or(
    FilterUsers.status.eq('active'),
    FilterUsers.status.eq('pending'),
  ),
).build()
// → "name=John;(status=active|status=pending)"
```

### Sort

```typescript
import { sort } from '@nestjs-filter-grammar/client-query-builder';
import { SortUsers } from './generated';

SortUsers.name.asc().build()    // "+name"
SortUsers.age.desc().build()    // "-age"

// Multiple
sort(
  SortUsers.name.asc(),
  SortUsers.age.desc(),
).build()
// → "+name,-age"
```

### Full Example

```typescript
import { and, or, sort } from '@nestjs-filter-grammar/client-query-builder';
import { FilterUsers, SortUsers } from './generated';

const filter = and(
  or(
    FilterUsers.status.eq('active'),
    FilterUsers.status.eq('pending'),
  ),
  FilterUsers.age.gte(18),
).build();

const sortStr = sort(
  SortUsers.name.asc(),
  SortUsers.age.desc(),
).build();

const response = await fetch(`/api/users?filter=${filter}&sort=${sortStr}`);
```

## Value Handling

- Plain strings pass through: `name=John`
- Values with special characters are auto-quoted: `name="Smith, Jr."`
- Quotes and backslashes inside values are escaped: `name="say \"hi\""`
- Numbers serialize as-is: `age>=18`
- Booleans serialize as-is: `active=true`
- Null: `email=null`
