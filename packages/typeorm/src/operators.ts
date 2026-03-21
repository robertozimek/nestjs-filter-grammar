import { FilterOperator } from '@nestjs-filter-grammar/core';

export interface OperatorSql {
  sql: string;
  like?: 'starts' | 'ends' | 'contains';
  caseInsensitive?: boolean;
}

const OPERATOR_SQL: Record<FilterOperator, OperatorSql> = {
  [FilterOperator.eq]: { sql: '__COL__ = __PARAM__' },
  [FilterOperator.neq]: { sql: '__COL__ != __PARAM__' },
  [FilterOperator.gt]: { sql: '__COL__ > __PARAM__' },
  [FilterOperator.lt]: { sql: '__COL__ < __PARAM__' },
  [FilterOperator.gte]: { sql: '__COL__ >= __PARAM__' },
  [FilterOperator.lte]: { sql: '__COL__ <= __PARAM__' },
  [FilterOperator.iEq]: { sql: 'LOWER(__COL__) = LOWER(__PARAM__)', caseInsensitive: true },
  [FilterOperator.iNeq]: { sql: 'LOWER(__COL__) != LOWER(__PARAM__)', caseInsensitive: true },
  [FilterOperator.startsWith]: { sql: '__COL__ LIKE __PARAM__', like: 'starts' },
  [FilterOperator.endsWith]: { sql: '__COL__ LIKE __PARAM__', like: 'ends' },
  [FilterOperator.contains]: { sql: '__COL__ LIKE __PARAM__', like: 'contains' },
  [FilterOperator.iStartsWith]: { sql: 'LOWER(__COL__) LIKE LOWER(__PARAM__)', like: 'starts', caseInsensitive: true },
  [FilterOperator.iEndsWith]: { sql: 'LOWER(__COL__) LIKE LOWER(__PARAM__)', like: 'ends', caseInsensitive: true },
  [FilterOperator.iContains]: { sql: 'LOWER(__COL__) LIKE LOWER(__PARAM__)', like: 'contains', caseInsensitive: true },
};

export function getOperatorSql(op: FilterOperator): OperatorSql {
  return OPERATOR_SQL[op];
}

export function wrapLikeValue(value: string, like: 'starts' | 'ends' | 'contains'): string {
  const escaped = value.replace(/%/g, '\\%').replace(/_/g, '\\_');
  switch (like) {
    case 'starts': return `${escaped}%`;
    case 'ends': return `%${escaped}`;
    case 'contains': return `%${escaped}%`;
  }
}
