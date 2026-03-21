import { Brackets } from 'typeorm';
import type { ObjectLiteral, SelectQueryBuilder, WhereExpressionBuilder } from 'typeorm';
import type {
  FilterTree,
  FilterCondition,
  FilterGroup,
  FilterValue,
} from '@nestjs-filter-grammar/core';
import { FilterOperator } from '@nestjs-filter-grammar/core';
import { getOperatorSql, wrapLikeValue } from './operators';
import type { ApplyFilterOptions, TypeOrmColumnMapFn } from './types';

interface ParamCounter {
  value: number;
}

function uniqueParam(field: string, counter: ParamCounter): string {
  return `filter_${field}_${counter.value++}`;
}

export function applyFilter<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  tree: FilterTree,
  options?: ApplyFilterOptions,
): SelectQueryBuilder<T> {
  const counter: ParamCounter = { value: 0 };
  applyNode(qb, tree, 'and', options?.columnMap, counter);
  return qb;
}

function applyNode(
  qb: WhereExpressionBuilder,
  node: FilterTree,
  context: 'and' | 'or',
  columnMap: ApplyFilterOptions['columnMap'] | undefined,
  counter: ParamCounter,
): void {
  if ('field' in node) {
    applyCondition(qb, node, context, columnMap, counter);
  } else {
    applyGroup(qb, node, context, columnMap, counter);
  }
}

function applyGroup(
  qb: WhereExpressionBuilder,
  group: FilterGroup,
  context: 'and' | 'or',
  columnMap: ApplyFilterOptions['columnMap'] | undefined,
  counter: ParamCounter,
): void {
  const method = context === 'and' ? 'andWhere' : 'orWhere';

  qb[method](new Brackets((subQb: WhereExpressionBuilder) => {
    const childContext = group.type === 'AND' ? 'and' : 'or';
    for (const child of group.conditions) {
      applyNode(subQb, child, childContext, columnMap, counter);
    }
  }));
}

function isNegationOperator(op: FilterOperator): boolean {
  return op === FilterOperator.neq || op === FilterOperator.iNeq;
}

function applyCondition(
  qb: WhereExpressionBuilder,
  condition: FilterCondition,
  context: 'and' | 'or',
  columnMap: ApplyFilterOptions['columnMap'] | undefined,
  counter: ParamCounter,
): void {
  const method = context === 'and' ? 'andWhere' : 'orWhere';

  // Check for column map callback
  if (columnMap && condition.field in columnMap) {
    const mapping = columnMap[condition.field];
    if (typeof mapping === 'function') {
      (mapping as TypeOrmColumnMapFn)(qb as SelectQueryBuilder<ObjectLiteral>, condition.operator, condition.values);
      return;
    }
  }

  // Resolve column name
  const column = (columnMap && typeof columnMap[condition.field] === 'string')
    ? columnMap[condition.field] as string
    : `entity.${condition.field}`;

  const { values, operator } = condition;
  const opSql = getOperatorSql(operator);

  const nullValues = values.filter((v) => v.type === 'null');
  const stringValues = values.filter((v): v is { type: 'string'; value: string } => v.type === 'string');

  if (stringValues.length === 0 && nullValues.length > 0) {
    const nullExpr = isNegationOperator(operator)
      ? `${column} IS NOT NULL`
      : `${column} IS NULL`;
    qb[method](nullExpr);
    return;
  }

  if (stringValues.length > 1) {
    const paramName = uniqueParam(condition.field, counter);
    const vals = stringValues.map((v) => v.value);

    if (nullValues.length > 0) {
      qb[method](new Brackets((sub: WhereExpressionBuilder) => {
        sub.orWhere(`${column} IN (:...${paramName})`, { [paramName]: vals });
        sub.orWhere(`${column} IS NULL`);
      }));
    } else {
      const inOp = isNegationOperator(operator) ? 'NOT IN' : 'IN';
      qb[method](`${column} ${inOp} (:...${paramName})`, { [paramName]: vals });
    }
    return;
  }

  const rawValue = stringValues[0].value;
  const paramName = uniqueParam(condition.field, counter);

  let paramValue = rawValue;
  if (opSql.like) {
    paramValue = wrapLikeValue(rawValue, opSql.like);
  }

  const sql = opSql.sql
    .replace(/__COL__/g, column)
    .replace(/__PARAM__/g, `:${paramName}`);

  if (nullValues.length > 0) {
    qb[method](new Brackets((sub: WhereExpressionBuilder) => {
      sub.orWhere(sql, { [paramName]: paramValue });
      sub.orWhere(`${column} IS NULL`);
    }));
  } else {
    qb[method](sql, { [paramName]: paramValue });
  }
}
