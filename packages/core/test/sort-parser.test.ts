import { describe, it, expect } from 'vitest';
import { parseSortString } from '../src/sort/sort-parser';
import { SortDirection } from '../src/types';

describe('parseSortString', () => {
  it('parses ascending with + prefix', () => {
    const result = parseSortString('+name');
    expect(result).toEqual([{ field: 'name', direction: SortDirection.asc }]);
  });

  it('parses descending with - prefix', () => {
    const result = parseSortString('-name');
    expect(result).toEqual([{ field: 'name', direction: SortDirection.desc }]);
  });

  it('defaults to ascending without prefix', () => {
    const result = parseSortString('name');
    expect(result).toEqual([{ field: 'name', direction: SortDirection.asc }]);
  });

  it('parses multiple sort fields', () => {
    const result = parseSortString('+name,-age,status');
    expect(result).toEqual([
      { field: 'name', direction: SortDirection.asc },
      { field: 'age', direction: SortDirection.desc },
      { field: 'status', direction: SortDirection.asc },
    ]);
  });

  it('preserves order (first = primary sort)', () => {
    const result = parseSortString('-priority,+created,name');
    expect(result).toHaveLength(3);
    expect(result[0].field).toBe('priority');
    expect(result[1].field).toBe('created');
    expect(result[2].field).toBe('name');
  });

  it('trims whitespace around fields', () => {
    const result = parseSortString('+name , -age');
    expect(result).toEqual([
      { field: 'name', direction: SortDirection.asc },
      { field: 'age', direction: SortDirection.desc },
    ]);
  });

  it('returns empty array for empty string', () => {
    const result = parseSortString('');
    expect(result).toEqual([]);
  });

  it('returns empty array for whitespace-only string', () => {
    const result = parseSortString('   ');
    expect(result).toEqual([]);
  });

  it('throws on invalid entry (empty field name)', () => {
    expect(() => parseSortString('+,name')).toThrow();
  });

  it('throws on duplicate fields', () => {
    expect(() => parseSortString('+name,-name')).toThrow();
  });
});
