# @nestjs-filter-grammar/core

Core package for nestjs-filter-grammar. Provides the Chevrotain-based filter/sort parser, NestJS decorators, validation, and Swagger description generation.

## Installation

```bash
npm install @nestjs-filter-grammar/core
```

### Peer Dependencies

- `@nestjs/common` >= 10.0.0
- `@nestjs/core` >= 10.0.0
- `reflect-metadata` >= 0.1.13
- `@nestjs/swagger` >= 7.0.0 (optional — for Swagger descriptions)

## API

### Decorators

#### `@Filterable()`

Class decorator — marks a query DTO as filterable.

```typescript
@Filterable()
class UserQuery { ... }
```

#### `@FilterableColumn(operators, options?)`

Property decorator — declares which filter operators a column supports.

```typescript
@FilterableColumn([FilterOperator.eq, FilterOperator.neq, FilterOperator.iContains])
name!: string;
```

The optional `options.type` parameter controls value coercion and validation. By default, values are strings.

```typescript
// Number — coerces "30" to 30, rejects "abc"
@FilterableColumn([FilterOperator.gte, FilterOperator.lte], { type: 'number' })
age!: number;

// Boolean — accepts "true"/"false" only
@FilterableColumn([FilterOperator.eq], { type: 'boolean' })
active!: boolean;

// Enum — validates value is one of the enum members
enum Status { active = 'active', inactive = 'inactive', pending = 'pending' }
@FilterableColumn([FilterOperator.eq, FilterOperator.neq], { type: Status })
status!: Status;

// String array — same as enum but without defining one
@FilterableColumn([FilterOperator.eq], { type: ['red', 'green', 'blue'] })
color!: string;

// Numeric enum — coerces "1" to 1, validates against allowed values
enum Priority { low = 0, medium = 1, high = 2 }
@FilterableColumn([FilterOperator.eq], { type: Priority })
priority!: Priority;
```

Quoted values (`field="123"`) are never coerced and always stay as strings, regardless of the declared type.

#### `@SortableColumn()`

Property decorator — marks a column as sortable.

```typescript
@SortableColumn()
name!: string;
```

#### `@Filter(queryClass, options?)`

NestJS parameter decorator — parses and validates filter/sort from query params.

```typescript
@Get()
findAll(@Filter(UserQuery) result: FilterResult) {
  const { filter, sort, query } = result;
}
```

Options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `queryParam` | `string` | `'filter'` | Name of the filter query parameter |
| `sortParam` | `string` | `'sort'` | Name of the sort query parameter |
| `optional` | `boolean` | `false` | Whether the filter param is optional |

### Parser

#### `parseFilter(input: string): FilterTree`

Parses a filter string into a `FilterTree` (AST). Throws on syntax errors.

```typescript
import { parseFilter } from '@nestjs-filter-grammar/core';

const tree = parseFilter('status=active;age>=18');
// { type: 'AND', conditions: [
//   { field: 'status', operator: '=', values: [{ type: 'string', value: 'active' }], ... },
//   { field: 'age', operator: '>=', values: [{ type: 'string', value: '18' }], ... },
// ]}
```

#### `parseSortString(input: string): SortEntry[]`

Parses a sort string into an array of sort entries.

```typescript
import { parseSortString } from '@nestjs-filter-grammar/core';

const entries = parseSortString('+name,-age');
// [{ field: 'name', direction: 'asc' }, { field: 'age', direction: 'desc' }]
```

### Validation

#### `validateFilter(tree, metadata): FilterError[]`

Validates a `FilterTree` against column metadata. Returns an array of errors (empty if valid).

#### `validateSort(entries, metadata): FilterError[]`

Validates sort entries against sortable column metadata.

### Types

#### `FilterOperator`

Enum of all supported operators: `eq`, `neq`, `gt`, `lt`, `gte`, `lte`, `iEq`, `iNeq`, `startsWith`, `endsWith`, `contains`, `iStartsWith`, `iEndsWith`, `iContains`.

#### `FilterTree`

Union of `FilterGroup | FilterCondition` — the parsed AST.

#### `FilterResult<T>`

Returned by the `@Filter()` decorator:

```typescript
interface FilterResult<T = Record<string, never>> {
  filter?: FilterTree;
  sort?: SortEntry[];
  query: T;
}
```

#### `SortDirection`

Enum: `asc`, `desc`.

#### `SortEntry`

```typescript
interface SortEntry {
  field: string;
  direction: SortDirection;
}
```

### Coercion

#### `coerceFilterValues(tree, metadata): CoerceResult`

Walks a `FilterTree` and converts string values to their declared types based on `ColumnMetadata.valueType`. Called automatically by `@Filter()`, but available for manual use when calling `parseFilter()` directly.

```typescript
import { parseFilter, coerceFilterValues } from '@nestjs-filter-grammar/core';

const tree = parseFilter('age>=30');
const { tree: coerced, errors } = coerceFilterValues(tree, metadata);
// coerced values: { type: 'number', value: 30 } instead of { type: 'string', value: '30' }
```

Quoted values (`field="123"`) are never coerced — they always remain strings.

### Swagger & OpenAPI

When `@nestjs/swagger` is installed, `@Filter()` automatically:

1. Adds `@ApiQuery` decorators with generated descriptions listing available columns and operators
2. Emits an `x-filter-grammar` extension on the operation with structured metadata for codegen:

```json
{
  "x-filter-grammar": {
    "filterParam": "filter",
    "sortParam": "sort",
    "fields": {
      "name": { "operators": ["=", "!=", "*~"], "type": "string" },
      "status": { "operators": ["=", "!="], "type": "enum", "values": ["active", "inactive"] },
      "age": { "operators": [">=", "<="], "type": "number" }
    },
    "sortable": ["name", "status", "age"]
  }
}
```

This extension is consumed by `@nestjs-filter-grammar/client-query-builder` to generate type-safe query builders.

### Parenthesized Expressions

The grammar supports parentheses for grouping:

```
(status=active|status=pending);age>=18
name=admin|(status=active;age>=18)
(a=1;b=2)|(c=3;d=4)
```
