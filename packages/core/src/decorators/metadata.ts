import 'reflect-metadata';
import { FILTERABLE_KEY, FILTERABLE_COLUMNS_KEY, SORTABLE_COLUMNS_KEY } from './constants';
import { AbstractConstructor, ColumnMetadata, SortableColumnMetadata } from '../types';

export function isFilterable(target: AbstractConstructor): boolean {
  return Reflect.getOwnMetadata(FILTERABLE_KEY, target) === true;
}

export function getFilterableMetadata(target: AbstractConstructor): ColumnMetadata[] {
  const result: ColumnMetadata[] = [];
  const seen = new Set<string>();

  // Walk the prototype chain to collect inherited columns
  let current: Function | null = target;
  while (current && current !== Function.prototype) {
    const columns: ColumnMetadata[] =
      Reflect.getOwnMetadata(FILTERABLE_COLUMNS_KEY, current) ?? [];

    for (const col of columns) {
      if (!seen.has(col.propertyKey)) {
        seen.add(col.propertyKey);
        result.push(col);
      }
    }

    current = Object.getPrototypeOf(current);
  }

  return result;
}

export function getSortableMetadata(target: AbstractConstructor): SortableColumnMetadata[] {
  const result: SortableColumnMetadata[] = [];
  const seen = new Set<string>();
  let current: Function | null = target;
  while (current && current !== Function.prototype) {
    const columns: SortableColumnMetadata[] =
      Reflect.getOwnMetadata(SORTABLE_COLUMNS_KEY, current) ?? [];
    for (const col of columns) {
      if (!seen.has(col.propertyKey)) {
        seen.add(col.propertyKey);
        result.push(col);
      }
    }
    current = Object.getPrototypeOf(current);
  }
  return result;
}
