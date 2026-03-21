export { SortDirection, SortEntry, SortableColumnMetadata } from './sort';
import type { SortEntry } from './sort';

export enum FilterOperator {
  /** Equals (=) */
  eq = '=',
  /** Not equals (!=) */
  neq = '!=',
  /** Greater than (>) */
  gt = '>',
  /** Less than (<) */
  lt = '<',
  /** Greater than or equal (>=) */
  gte = '>=',
  /** Less than or equal (<=) */
  lte = '<=',
  /** Case-insensitive equals (~) */
  iEq = '~',
  /** Case-insensitive not equals (!~) */
  iNeq = '!~',
  /** Starts with, case-sensitive (^=) */
  startsWith = '^=',
  /** Ends with, case-sensitive ($=) */
  endsWith = '$=',
  /** Contains, case-sensitive (*=) */
  contains = '*=',
  /** Starts with, case-insensitive (^~) */
  iStartsWith = '^~',
  /** Ends with, case-insensitive ($~) */
  iEndsWith = '$~',
  /** Contains, case-insensitive (*~) */
  iContains = '*~',
}

/** Operators that support multi-value (comma-separated) IN semantics */
export const EQUALITY_OPERATORS: ReadonlySet<FilterOperator> = new Set([
  FilterOperator.eq,
  FilterOperator.neq,
  FilterOperator.iEq,
  FilterOperator.iNeq,
]);

export type FilterTree = FilterGroup | FilterCondition;

export interface FilterGroup {
  type: 'AND' | 'OR';
  conditions: FilterTree[];
}

export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  values: FilterValue[];
  /** Character offset of the field token in the original input */
  fieldOffset: number;
  /** Character offset of the operator token in the original input */
  operatorOffset: number;
}

export type FilterValue =
  | { type: 'null' }
  | { type: 'string'; value: string };

export interface FilterResult<T = Record<string, never>> {
  filter?: FilterTree;
  sort?: SortEntry[];
  query: T;
}

export interface FilterError {
  message: string;
  offset: number;
  length: number;
  field?: string;
  operator?: string;
}

export interface FilterAdapter<TResult, TColumnMap = unknown> {
  apply(tree: FilterTree, options?: { columnMap?: TColumnMap }): TResult;
}

/** Metadata stored per filterable column by @FilterableColumn */
export interface ColumnMetadata {
  propertyKey: string;
  operators: FilterOperator[];
}
