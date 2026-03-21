import 'reflect-metadata';
import { SORTABLE_COLUMNS_KEY } from './constants';
import { SortableColumnMetadata } from '../types';

export function SortableColumn(): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: SortableColumnMetadata[] =
      Reflect.getOwnMetadata(SORTABLE_COLUMNS_KEY, target.constructor) ?? [];
    existing.push({ propertyKey: String(propertyKey) });
    Reflect.defineMetadata(SORTABLE_COLUMNS_KEY, existing, target.constructor);
  };
}
