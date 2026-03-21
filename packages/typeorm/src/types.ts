import type { SelectQueryBuilder } from 'typeorm';
import type { FilterOperator, FilterValue } from '@nestjs-filter-grammar/core';

export type TypeOrmColumnMapFn = (
  qb: SelectQueryBuilder<any>,
  operator: FilterOperator,
  values: FilterValue[],
) => void;

export type TypeOrmColumnMap = Record<string, string | TypeOrmColumnMapFn>;

export type TypeOrmSortMapFn = (
  qb: SelectQueryBuilder<any>,
  direction: 'ASC' | 'DESC',
) => void;

export type TypeOrmSortMap = Record<string, string | TypeOrmSortMapFn>;

export interface ApplyFilterOptions {
  columnMap?: TypeOrmColumnMap;
}

export interface ApplySortOptions {
  columnMap?: TypeOrmSortMap;
}
