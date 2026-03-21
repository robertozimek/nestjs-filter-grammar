import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { FilterOperator, FilterValue } from '@nestjs-filter-grammar/core';

export type TypeOrmColumnMapFn = (
  qb: SelectQueryBuilder<ObjectLiteral>,
  operator: FilterOperator,
  values: FilterValue[],
) => void;

export type TypeOrmColumnMap = Record<string, string | TypeOrmColumnMapFn>;

export type TypeOrmSortMapFn = (
  qb: SelectQueryBuilder<ObjectLiteral>,
  direction: 'ASC' | 'DESC',
) => void;

export type TypeOrmSortMap = Record<string, string | TypeOrmSortMapFn>;

export interface ApplyFilterOptions {
  columnMap?: TypeOrmColumnMap;
}

export interface ApplySortOptions {
  columnMap?: TypeOrmSortMap;
}
