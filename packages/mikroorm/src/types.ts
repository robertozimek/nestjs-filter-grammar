import type { FilterOperator, FilterValue } from '@nestjs-filter-grammar/core';

/** Recursive type representing a MikroORM FilterQuery/QueryOrderMap value */
export type MikroOrmQueryValue =
  | string
  | number
  | boolean
  | null
  | MikroOrmQueryValue[]
  | { [key: string]: MikroOrmQueryValue };

export type MikroOrmColumnMapFn = (
  operator: FilterOperator,
  values: FilterValue[],
) => Record<string, MikroOrmQueryValue>;

export type MikroOrmColumnMap = Record<string, string | MikroOrmColumnMapFn>;

export type MikroOrmSortMapFn = (
  direction: 'asc' | 'desc',
) => Record<string, MikroOrmQueryValue>;

export type MikroOrmSortMap = Record<string, string | MikroOrmSortMapFn>;

export interface ApplyFilterOptions {
  columnMap?: MikroOrmColumnMap;
}

export interface ApplySortOptions {
  columnMap?: MikroOrmSortMap;
}
