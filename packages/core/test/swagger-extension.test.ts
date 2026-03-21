import { describe, it, expect } from 'vitest';
import { buildFilterGrammarExtension } from '../src/swagger/swagger.util';
import { FilterOperator, ColumnMetadata, SortableColumnMetadata } from '../src/types';

describe('buildFilterGrammarExtension', () => {
  it('produces extension for string columns', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'name', operators: [FilterOperator.eq, FilterOperator.iContains], valueType: 'string' },
    ];
    const ext = buildFilterGrammarExtension(metadata, [], 'filter', 'sort');
    expect(ext).toEqual({
      filterParam: 'filter',
      sortParam: 'sort',
      fields: {
        name: { operators: ['=', '*~'], type: 'string' },
      },
      sortable: [],
    });
  });

  it('produces extension for number columns', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'age', operators: [FilterOperator.gte, FilterOperator.lte], valueType: 'number' },
    ];
    const ext = buildFilterGrammarExtension(metadata, [], 'filter', 'sort');
    expect(ext.fields.age).toEqual({ operators: ['>=', '<='], type: 'number' });
  });

  it('produces extension for boolean columns', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'active', operators: [FilterOperator.eq], valueType: 'boolean' },
    ];
    const ext = buildFilterGrammarExtension(metadata, [], 'filter', 'sort');
    expect(ext.fields.active).toEqual({ operators: ['='], type: 'boolean' });
  });

  it('produces extension for enum columns (string array)', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'status', operators: [FilterOperator.eq, FilterOperator.neq], valueType: ['active', 'inactive', 'pending'] },
    ];
    const ext = buildFilterGrammarExtension(metadata, [], 'filter', 'sort');
    expect(ext.fields.status).toEqual({
      operators: ['=', '!='],
      type: 'enum',
      values: ['active', 'inactive', 'pending'],
    });
  });

  it('produces extension for enum columns (object enum)', () => {
    enum Status { active = 'active', inactive = 'inactive' }
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'status', operators: [FilterOperator.eq], valueType: Status },
    ];
    const ext = buildFilterGrammarExtension(metadata, [], 'filter', 'sort');
    expect(ext.fields.status).toEqual({
      operators: ['='],
      type: 'enum',
      values: ['active', 'inactive'],
    });
  });

  it('produces extension for numeric enum', () => {
    enum Priority { low = 0, medium = 1, high = 2 }
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'priority', operators: [FilterOperator.eq], valueType: Priority },
    ];
    const ext = buildFilterGrammarExtension(metadata, [], 'filter', 'sort');
    expect(ext.fields.priority).toEqual({
      operators: ['='],
      type: 'enum',
      values: [0, 1, 2],
    });
  });

  it('includes sortable fields', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'name', operators: [FilterOperator.eq], valueType: 'string' },
    ];
    const sortable: SortableColumnMetadata[] = [
      { propertyKey: 'name' },
      { propertyKey: 'age' },
    ];
    const ext = buildFilterGrammarExtension(metadata, sortable, 'filter', 'sort');
    expect(ext.sortable).toEqual(['name', 'age']);
  });

  it('uses custom param names', () => {
    const ext = buildFilterGrammarExtension([], [], 'q', 'order');
    expect(ext.filterParam).toBe('q');
    expect(ext.sortParam).toBe('order');
  });
});
