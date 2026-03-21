import type { FilterOperator, FilterValue } from '@nestjs-filter-grammar/core';

export type PrismaColumnMapFn = (
  operator: FilterOperator,
  values: FilterValue[],
) => Record<string, any>;

export type PrismaColumnMap = Record<string, string | PrismaColumnMapFn>;

export type PrismaSortMapFn = (
  direction: 'asc' | 'desc',
) => Record<string, any>;

export type PrismaSortMap = Record<string, string | PrismaSortMapFn>;

export interface ApplyFilterOptions {
  columnMap?: PrismaColumnMap;
}

export interface ApplySortOptions {
  columnMap?: PrismaSortMap;
}
