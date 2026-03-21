import 'reflect-metadata';
import { FILTERABLE_COLUMNS_KEY } from './constants';
import { FilterOperator, ColumnMetadata, FilterValueType } from '../types';

export interface FilterableColumnOptions {
  type?: FilterValueType;
}

export function FilterableColumn(
  operators: FilterOperator[],
  options?: FilterableColumnOptions,
): PropertyDecorator {
  return (target: object, propertyKey: string | symbol) => {
    const existing: ColumnMetadata[] =
      Reflect.getOwnMetadata(FILTERABLE_COLUMNS_KEY, target.constructor) ?? [];

    existing.push({
      propertyKey: String(propertyKey),
      operators,
      valueType: options?.type ?? 'string',
    });

    Reflect.defineMetadata(FILTERABLE_COLUMNS_KEY, existing, target.constructor);
  };
}
