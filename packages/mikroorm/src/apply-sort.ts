import type { SortEntry } from '@nestjs-filter-grammar/core';
import type { ApplySortOptions, MikroOrmSortMapFn } from './types';

export function applySort(
  entries: SortEntry[],
  options?: ApplySortOptions,
): Record<string, any> {
  const orderMap: Record<string, any> = {};

  for (const entry of entries) {
    if (options?.columnMap && entry.field in options.columnMap) {
      const mapping = options.columnMap[entry.field];
      if (typeof mapping === 'function') {
        Object.assign(orderMap, (mapping as MikroOrmSortMapFn)(entry.direction));
        continue;
      }
      orderMap[mapping as string] = entry.direction;
      continue;
    }

    orderMap[entry.field] = entry.direction;
  }

  return orderMap;
}
