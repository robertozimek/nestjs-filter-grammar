import { FilterOperator } from '@nestjs-filter-grammar/core';

export type PrismaOperatorKey =
  | 'equals'
  | 'not'
  | 'gt'
  | 'lt'
  | 'gte'
  | 'lte'
  | 'startsWith'
  | 'endsWith'
  | 'contains';

export interface PrismaOperatorMapping {
  key: PrismaOperatorKey;
  insensitive?: boolean;
  negate?: boolean;
}

const OPERATOR_MAP: Record<FilterOperator, PrismaOperatorMapping> = {
  [FilterOperator.eq]: { key: 'equals' },
  [FilterOperator.neq]: { key: 'equals', negate: true },
  [FilterOperator.gt]: { key: 'gt' },
  [FilterOperator.lt]: { key: 'lt' },
  [FilterOperator.gte]: { key: 'gte' },
  [FilterOperator.lte]: { key: 'lte' },
  [FilterOperator.iEq]: { key: 'equals', insensitive: true },
  [FilterOperator.iNeq]: { key: 'equals', negate: true, insensitive: true },
  [FilterOperator.startsWith]: { key: 'startsWith' },
  [FilterOperator.endsWith]: { key: 'endsWith' },
  [FilterOperator.contains]: { key: 'contains' },
  [FilterOperator.iStartsWith]: { key: 'startsWith', insensitive: true },
  [FilterOperator.iEndsWith]: { key: 'endsWith', insensitive: true },
  [FilterOperator.iContains]: { key: 'contains', insensitive: true },
};

export function getPrismaOperator(op: FilterOperator): PrismaOperatorMapping {
  return OPERATOR_MAP[op];
}
