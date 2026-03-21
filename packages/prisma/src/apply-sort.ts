import type { SortEntry } from '@nestjs-filter-grammar/core';
import type { ApplySortOptions, PrismaQueryValue } from './types';

export function applySort(
  entries: SortEntry[],
  options?: ApplySortOptions,
): Record<string, PrismaQueryValue>[] {
  return entries.map((entry) => {
    const direction = entry.direction;

    if (options?.columnMap && entry.field in options.columnMap) {
      const mapping = options.columnMap[entry.field];
      if (typeof mapping === 'function') {
        return mapping(direction);
      }
      if (typeof mapping === 'string') {
        return { [mapping]: direction };
      }
    }

    return { [entry.field]: direction };
  });
}
