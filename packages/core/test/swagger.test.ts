import 'reflect-metadata';
import { describe, it, expect } from 'vitest';
import { buildSwaggerDescription, buildSortSwaggerDescription } from '../src/swagger/swagger.util';
import { FilterOperator, ColumnMetadata, SortableColumnMetadata } from '../src/types';

describe('buildSwaggerDescription', () => {
  it('generates description for single column', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'id', operators: [FilterOperator.eq, FilterOperator.neq] },
    ];
    const desc = buildSwaggerDescription(metadata);
    expect(desc).toContain('id: (=, !=)');
  });

  it('generates description for multiple columns', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'id', operators: [FilterOperator.eq, FilterOperator.neq] },
      { propertyKey: 'name', operators: [FilterOperator.eq, FilterOperator.iContains] },
    ];
    const desc = buildSwaggerDescription(metadata);
    expect(desc).toContain('id: (=, !=)');
    expect(desc).toContain('name: (=, *~)');
  });

  it('includes syntax guide', () => {
    const metadata: ColumnMetadata[] = [
      { propertyKey: 'id', operators: [FilterOperator.eq] },
    ];
    const desc = buildSwaggerDescription(metadata);
    expect(desc).toContain('AND:');
    expect(desc).toContain('OR:');
    expect(desc).toContain('IN:');
    expect(desc).toContain('Null:');
  });

  it('returns empty string for no columns', () => {
    const desc = buildSwaggerDescription([]);
    expect(desc).toBe('');
  });
});

describe('buildSortSwaggerDescription', () => {
  it('generates description for sortable columns', () => {
    const metadata: SortableColumnMetadata[] = [
      { propertyKey: 'name' },
      { propertyKey: 'createdAt' },
    ];
    const desc = buildSortSwaggerDescription(metadata);
    expect(desc).toContain('name');
    expect(desc).toContain('createdAt');
    expect(desc).toContain('+field');
    expect(desc).toContain('-field');
  });

  it('returns empty string for no sortable columns', () => {
    const desc = buildSortSwaggerDescription([]);
    expect(desc).toBe('');
  });
});
