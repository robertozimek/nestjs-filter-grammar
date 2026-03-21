import 'reflect-metadata';
import { FILTERABLE_COLUMNS_KEY } from './constants';
import { FilterOperator, ColumnMetadata } from '../types';

export function FilterableColumn(operators: FilterOperator[]): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: ColumnMetadata[] =
      Reflect.getOwnMetadata(FILTERABLE_COLUMNS_KEY, target.constructor) ?? [];

    existing.push({
      propertyKey: String(propertyKey),
      operators,
    });

    Reflect.defineMetadata(FILTERABLE_COLUMNS_KEY, existing, target.constructor);
  };
}
