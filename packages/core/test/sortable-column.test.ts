import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Filterable } from '../src/decorators/filterable.decorator';
import { SortableColumn } from '../src/decorators/sortable-column.decorator';
import { FilterableColumn } from '../src/decorators/filterable-column.decorator';
import { getSortableMetadata } from '../src/decorators/metadata';
import { FilterOperator } from '../src/types';

describe('@SortableColumn()', () => {
  it('marks a property as sortable', () => {
    @Filterable()
    class TestQuery {
      @SortableColumn()
      name!: string;
    }
    const metadata = getSortableMetadata(TestQuery);
    expect(metadata).toHaveLength(1);
    expect(metadata[0]).toEqual({ propertyKey: 'name' });
  });

  it('stores metadata for multiple columns', () => {
    @Filterable()
    class TestQuery {
      @SortableColumn()
      name!: string;
      @SortableColumn()
      age!: number;
    }
    const metadata = getSortableMetadata(TestQuery);
    expect(metadata).toHaveLength(2);
    expect(metadata.map((m) => m.propertyKey)).toEqual(['name', 'age']);
  });

  it('works alongside @FilterableColumn', () => {
    @Filterable()
    class TestQuery {
      @FilterableColumn([FilterOperator.eq])
      @SortableColumn()
      name!: string;
    }
    const metadata = getSortableMetadata(TestQuery);
    expect(metadata).toHaveLength(1);
    expect(metadata[0].propertyKey).toBe('name');
  });

  it('inherits sortable columns from parent', () => {
    @Filterable()
    class ParentQuery {
      @SortableColumn()
      name!: string;
    }
    @Filterable()
    class ChildQuery extends ParentQuery {
      @SortableColumn()
      age!: number;
    }
    const metadata = getSortableMetadata(ChildQuery);
    expect(metadata).toHaveLength(2);
    expect(metadata.map((m) => m.propertyKey).sort()).toEqual(['age', 'name']);
  });

  it('returns empty array for class with no sortable columns', () => {
    @Filterable()
    class TestQuery {
      @FilterableColumn([FilterOperator.eq])
      name!: string;
    }
    const metadata = getSortableMetadata(TestQuery);
    expect(metadata).toHaveLength(0);
  });
});
