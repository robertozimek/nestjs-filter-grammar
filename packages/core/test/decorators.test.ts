import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { Filterable } from '../src/decorators/filterable.decorator';
import { FilterableColumn } from '../src/decorators/filterable-column.decorator';
import { getFilterableMetadata, isFilterable } from '../src/decorators/metadata';
import { FilterOperator } from '../src/types';

describe('Decorators', () => {
  describe('@Filterable()', () => {
    it('marks a class as filterable', () => {
      @Filterable()
      class TestQuery {
        @FilterableColumn([FilterOperator.eq])
        name!: string;
      }

      expect(isFilterable(TestQuery)).toBe(true);
    });

    it('returns false for unmarked class', () => {
      class NotFilterable {}
      expect(isFilterable(NotFilterable)).toBe(false);
    });
  });

  describe('@FilterableColumn()', () => {
    it('stores operator metadata on properties', () => {
      @Filterable()
      class TestQuery {
        @FilterableColumn([FilterOperator.eq, FilterOperator.neq])
        status!: string;
      }

      const metadata = getFilterableMetadata(TestQuery);
      expect(metadata).toHaveLength(1);
      expect(metadata[0]).toEqual({
        propertyKey: 'status',
        operators: [FilterOperator.eq, FilterOperator.neq],
      });
    });

    it('stores metadata for multiple columns', () => {
      @Filterable()
      class TestQuery {
        @FilterableColumn([FilterOperator.eq])
        name!: string;

        @FilterableColumn([FilterOperator.gte, FilterOperator.lte])
        age!: number;
      }

      const metadata = getFilterableMetadata(TestQuery);
      expect(metadata).toHaveLength(2);
      expect(metadata.map((m) => m.propertyKey)).toEqual(['name', 'age']);
    });
  });

  describe('inheritance', () => {
    it('child class inherits parent filterable columns', () => {
      @Filterable()
      class ParentQuery {
        @FilterableColumn([FilterOperator.eq])
        status!: string;
      }

      @Filterable()
      class ChildQuery extends ParentQuery {
        @FilterableColumn([FilterOperator.gte])
        age!: number;
      }

      const metadata = getFilterableMetadata(ChildQuery);
      expect(metadata).toHaveLength(2);
      expect(metadata.map((m) => m.propertyKey).sort()).toEqual(['age', 'status']);
    });

    it('child without @Filterable() is not recognized', () => {
      @Filterable()
      class ParentQuery {
        @FilterableColumn([FilterOperator.eq])
        status!: string;
      }

      class ChildWithoutDecorator extends ParentQuery {}

      expect(isFilterable(ChildWithoutDecorator)).toBe(false);
    });

    it('child can have non-filterable properties', () => {
      @Filterable()
      class ParentQuery {
        @FilterableColumn([FilterOperator.eq])
        status!: string;
      }

      @Filterable()
      class ChildQuery extends ParentQuery {
        includeChildren!: boolean;
      }

      const metadata = getFilterableMetadata(ChildQuery);
      expect(metadata).toHaveLength(1);
      expect(metadata[0].propertyKey).toBe('status');
    });
  });
});
