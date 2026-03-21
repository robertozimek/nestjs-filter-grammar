import type { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import type { SortEntry } from '@nestjs-filter-grammar/core';
import type { ApplySortOptions } from './types';

export function applySort<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  entries: SortEntry[],
  options?: ApplySortOptions,
): SelectQueryBuilder<T> {
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const sqlDirection: 'ASC' | 'DESC' = entry.direction === 'asc' ? 'ASC' : 'DESC';

    if (options?.columnMap && entry.field in options.columnMap) {
      const mapping = options.columnMap[entry.field];
      if (typeof mapping === 'function') {
        mapping(qb as SelectQueryBuilder<ObjectLiteral>, sqlDirection);
        continue;
      }
    }

    const mappedColumn = options?.columnMap?.[entry.field];
    const column = typeof mappedColumn === 'string' ? mappedColumn : `entity.${entry.field}`;

    if (i === 0) {
      qb.orderBy(column, sqlDirection);
    } else {
      qb.addOrderBy(column, sqlDirection);
    }
  }

  return qb;
}
