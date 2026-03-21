import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { validateSort } from '../src/sort/sort-validator';
import { parseSortString } from '../src/sort/sort-parser';
import { Filterable } from '../src/decorators/filterable.decorator';
import { SortableColumn } from '../src/decorators/sortable-column.decorator';
import { getSortableMetadata } from '../src/decorators/metadata';

@Filterable()
class TestQuery {
  @SortableColumn()
  name!: string;
  @SortableColumn()
  age!: number;
}

const metadata = getSortableMetadata(TestQuery);

describe('validateSort', () => {
  it('returns no errors for valid sort', () => {
    const entries = parseSortString('+name,-age');
    const errors = validateSort(entries, metadata);
    expect(errors).toHaveLength(0);
  });

  it('returns error for unknown sort field', () => {
    const entries = parseSortString('+unknown');
    const errors = validateSort(entries, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('unknown');
    expect(errors[0].field).toBe('unknown');
  });

  it('collects multiple errors', () => {
    const entries = parseSortString('+unknown1,-unknown2');
    const errors = validateSort(entries, metadata);
    expect(errors).toHaveLength(2);
  });

  it('returns no errors for empty sort', () => {
    const errors = validateSort([], metadata);
    expect(errors).toHaveLength(0);
  });
});
