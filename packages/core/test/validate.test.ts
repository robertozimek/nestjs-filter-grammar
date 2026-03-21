import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { validateFilter } from '../src/validate';
import { parseFilter } from '../src/parse';
import { Filterable } from '../src/decorators/filterable.decorator';
import { FilterableColumn } from '../src/decorators/filterable-column.decorator';
import { getFilterableMetadata } from '../src/decorators/metadata';
import { FilterOperator } from '../src/types';

@Filterable()
class TestQuery {
  @FilterableColumn([FilterOperator.eq, FilterOperator.neq])
  status!: string;

  @FilterableColumn([FilterOperator.eq, FilterOperator.gte, FilterOperator.lte])
  age!: number;
}

const metadata = getFilterableMetadata(TestQuery);

describe('validateFilter', () => {
  it('returns no errors for valid filter', () => {
    const tree = parseFilter('status=active');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(0);
  });

  it('returns error for unknown field', () => {
    const tree = parseFilter('unknown=value');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('unknown');
    expect(errors[0].field).toBe('unknown');
  });

  it('returns error for disallowed operator', () => {
    const tree = parseFilter('status>=active');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('>=');
    expect(errors[0].field).toBe('status');
    expect(errors[0].operator).toBe('>=');
  });

  it('returns error for multi-value with non-equality operator', () => {
    const tree = parseFilter('age>=18,21');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('multiple values');
  });

  it('allows multi-value with equality operator', () => {
    const tree = parseFilter('status=active,pending');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(0);
  });

  it('collects multiple errors', () => {
    const tree = parseFilter('unknown=value;status>=active');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(2);
  });

  it('validates through AND groups', () => {
    const tree = parseFilter('status=active;unknown=value');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('unknown');
  });

  it('validates through OR groups', () => {
    const tree = parseFilter('status=active|unknown=value');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].field).toBe('unknown');
  });

  it('validates nested AND/OR groups', () => {
    const tree = parseFilter('unknown1=a;unknown2=b|status>=c');
    const errors = validateFilter(tree, metadata);
    expect(errors).toHaveLength(3);
  });
});
