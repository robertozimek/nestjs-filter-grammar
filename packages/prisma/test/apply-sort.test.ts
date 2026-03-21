import { describe, it, expect } from 'vitest';
import { SortDirection, SortEntry } from '@nestjs-filter-grammar/core';
import { applySort } from '../src/apply-sort';

describe('applySort (Prisma)', () => {
  it('produces ascending orderBy', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(entries);
    expect(result).toEqual([{ name: 'asc' }]);
  });

  it('produces descending orderBy', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.desc }];
    const result = applySort(entries);
    expect(result).toEqual([{ name: 'desc' }]);
  });

  it('produces multiple orderBy entries preserving order', () => {
    const entries: SortEntry[] = [
      { field: 'name', direction: SortDirection.asc },
      { field: 'age', direction: SortDirection.desc },
    ];
    const result = applySort(entries);
    expect(result).toEqual([
      { name: 'asc' },
      { age: 'desc' },
    ]);
  });

  it('applies column map rename', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(entries, { columnMap: { name: 'userName' } });
    expect(result).toEqual([{ userName: 'asc' }]);
  });

  it('applies column map callback', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(entries, {
      columnMap: {
        name: (direction) => ({ user: { name: direction } }),
      },
    });
    expect(result).toEqual([{ user: { name: 'asc' } }]);
  });

  it('returns empty array for no entries', () => {
    const result = applySort([]);
    expect(result).toEqual([]);
  });
});
