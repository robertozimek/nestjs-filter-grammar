import type { SelectQueryBuilder } from 'typeorm';
import type { SortEntry } from '@nestjs-filter-grammar/core';
import type { ApplySortOptions, TypeOrmSortMapFn } from './types';

export function applySort(
  qb: SelectQueryBuilder<any>,
  entries: SortEntry[],
  options?: ApplySortOptions,
): SelectQueryBuilder<any> {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const sqlDirection = entry.direction === 'asc' ? 'ASC' : 'DESC';

    if (options?.columnMap && entry.field in options.columnMap) {
      const mapping = options.columnMap[entry.field];
      if (typeof mapping === 'function') {
        (mapping as TypeOrmSortMapFn)(qb, sqlDirection);
        continue;
      }
    }

    const column = (options?.columnMap && typeof options.columnMap[entry.field] === 'string')
      ? options.columnMap[entry.field] as string
      : `entity.${entry.field}`;

    if (i === 0) {
      qb.orderBy(column, sqlDirection as 'ASC' | 'DESC');
    } else {
      qb.addOrderBy(column, sqlDirection as 'ASC' | 'DESC');
    }
  }

  return qb;
}
