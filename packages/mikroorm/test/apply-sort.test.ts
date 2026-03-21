import { describe, it, expect } from 'vitest';
import { SortDirection, SortEntry } from '@nestjs-filter-grammar/core';
import { applySort } from '../src/apply-sort';

describe('applySort (MikroORM)', () => {
  it('produces ascending QueryOrderMap', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(entries);
    expect(result).toEqual({ name: 'asc' });
  });

  it('produces descending QueryOrderMap', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.desc }];
    const result = applySort(entries);
    expect(result).toEqual({ name: 'desc' });
  });

  it('produces multiple sort entries preserving order', () => {
    const entries: SortEntry[] = [
      { field: 'name', direction: SortDirection.asc },
      { field: 'age', direction: SortDirection.desc },
    ];
    const result = applySort(entries);
    expect(result).toEqual({ name: 'asc', age: 'desc' });
    const keys = Object.keys(result);
    expect(keys).toEqual(['name', 'age']);
  });

  it('applies column map rename', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(entries, { columnMap: { name: 'userName' } });
    expect(result).toEqual({ userName: 'asc' });
  });

  it('applies column map callback', () => {
    const entries: SortEntry[] = [{ field: 'name', direction: SortDirection.asc }];
    const result = applySort(entries, {
      columnMap: {
        name: (direction) => ({ user: { name: direction } }),
      },
    });
    expect(result).toEqual({ user: { name: 'asc' } });
  });

  it('returns empty object for no entries', () => {
    const result = applySort([]);
    expect(result).toEqual({});
  });
});
