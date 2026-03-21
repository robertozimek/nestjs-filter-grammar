import { FilterOperator } from '@nestjs-filter-grammar/core';

export type MikroOrmOperatorKey =
  | '$eq'
  | '$ne'
  | '$gt'
  | '$lt'
  | '$gte'
  | '$lte'
  | '$like'
  | '$ilike';

export interface MikroOrmOperatorMapping {
  key: MikroOrmOperatorKey;
  like?: 'starts' | 'ends' | 'contains';
  caseInsensitive?: boolean;
  negate?: boolean;
}

const OPERATOR_MAP: Record<FilterOperator, MikroOrmOperatorMapping> = {
  [FilterOperator.eq]: { key: '$eq' },
  [FilterOperator.neq]: { key: '$ne' },
  [FilterOperator.gt]: { key: '$gt' },
  [FilterOperator.lt]: { key: '$lt' },
  [FilterOperator.gte]: { key: '$gte' },
  [FilterOperator.lte]: { key: '$lte' },
  [FilterOperator.iEq]: { key: '$ilike', caseInsensitive: true },
  [FilterOperator.iNeq]: { key: '$ilike', caseInsensitive: true, negate: true },
  [FilterOperator.startsWith]: { key: '$like', like: 'starts' },
  [FilterOperator.endsWith]: { key: '$like', like: 'ends' },
  [FilterOperator.contains]: { key: '$like', like: 'contains' },
  [FilterOperator.iStartsWith]: { key: '$ilike', like: 'starts', caseInsensitive: true },
  [FilterOperator.iEndsWith]: { key: '$ilike', like: 'ends', caseInsensitive: true },
  [FilterOperator.iContains]: { key: '$ilike', like: 'contains', caseInsensitive: true },
};

export function getMikroOrmOperator(op: FilterOperator): MikroOrmOperatorMapping {
  return OPERATOR_MAP[op];
}

export function wrapLikeValue(value: string, like: 'starts' | 'ends' | 'contains'): string {
  const escaped = value.replace(/%/g, '\\%').replace(/_/g, '\\_');
  switch (like) {
    case 'starts': return `${escaped}%`;
    case 'ends': return `%${escaped}`;
    case 'contains': return `%${escaped}%`;
  }
}
