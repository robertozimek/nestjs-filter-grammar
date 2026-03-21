import type { SortEntry } from '@nestjs-filter-grammar/core';
import type { ApplySortOptions, PrismaSortMapFn } from './types';

export function applySort(
  entries: SortEntry[],
  options?: ApplySortOptions,
): Record<string, any>[] {
  return entries.map((entry) => {
    const direction = entry.direction;

    if (options?.columnMap && entry.field in options.columnMap) {
      const mapping = options.columnMap[entry.field];
      if (typeof mapping === 'function') {
        return (mapping as PrismaSortMapFn)(direction);
      }
      return { [mapping as string]: direction };
    }

    return { [entry.field]: direction };
  });
}
