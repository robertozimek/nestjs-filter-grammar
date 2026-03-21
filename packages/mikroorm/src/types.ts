import type { FilterOperator, FilterValue } from '@nestjs-filter-grammar/core';

export type MikroOrmColumnMapFn = (
  operator: FilterOperator,
  values: FilterValue[],
) => Record<string, any>;

export type MikroOrmColumnMap = Record<string, string | MikroOrmColumnMapFn>;

export type MikroOrmSortMapFn = (
  direction: 'asc' | 'desc',
) => Record<string, any>;

export type MikroOrmSortMap = Record<string, string | MikroOrmSortMapFn>;

export interface ApplyFilterOptions {
  columnMap?: MikroOrmColumnMap;
}

export interface ApplySortOptions {
  columnMap?: MikroOrmSortMap;
}
