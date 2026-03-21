import 'reflect-metadata';
import { FILTERABLE_KEY, FILTERABLE_COLUMNS_KEY } from './constants';
import { ColumnMetadata } from '../types';

export function isFilterable(target: Function): boolean {
  return Reflect.getOwnMetadata(FILTERABLE_KEY, target) === true;
}

export function getFilterableMetadata(target: Function): ColumnMetadata[] {
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
