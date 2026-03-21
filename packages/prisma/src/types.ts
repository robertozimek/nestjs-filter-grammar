import type { FilterOperator, FilterValue } from '@nestjs-filter-grammar/core';

/** Recursive type representing a Prisma where/orderBy object value */
export type PrismaQueryValue =
  | string
  | number
  | boolean
  | null
  | PrismaQueryValue[]
  | { [key: string]: PrismaQueryValue };

export type PrismaColumnMapFn = (
  operator: FilterOperator,
  values: FilterValue[],
) => Record<string, PrismaQueryValue>;

export type PrismaColumnMap = Record<string, string | PrismaColumnMapFn>;

export type PrismaSortMapFn = (
  direction: 'asc' | 'desc',
) => Record<string, PrismaQueryValue>;

export type PrismaSortMap = Record<string, string | PrismaSortMapFn>;

export interface ApplyFilterOptions {
  columnMap?: PrismaColumnMap;
}

export interface ApplySortOptions {
  columnMap?: PrismaSortMap;
}
