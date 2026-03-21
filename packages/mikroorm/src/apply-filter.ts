import type {
  FilterTree,
  FilterCondition,
  FilterGroup,
} from '@nestjs-filter-grammar/core';
import { getMikroOrmOperator, wrapLikeValue } from './operators';
import type { ApplyFilterOptions, MikroOrmQueryValue } from './types';

export function applyFilter(
  tree: FilterTree,
  options?: ApplyFilterOptions,
): Record<string, MikroOrmQueryValue> {
  return buildNode(tree, options?.columnMap);
}

function buildNode(
  node: FilterTree,
  columnMap?: ApplyFilterOptions['columnMap'],
): Record<string, MikroOrmQueryValue> {
  if ('field' in node) {
    return buildCondition(node, columnMap);
  }
  return buildGroup(node, columnMap);
}

function buildGroup(
  group: FilterGroup,
  columnMap?: ApplyFilterOptions['columnMap'],
): Record<string, MikroOrmQueryValue> {
  const key = group.type === 'AND' ? '$and' : '$or';
  const children = group.conditions.map((c) => buildNode(c, columnMap));
  return { [key]: children };
}

function buildCondition(
  condition: FilterCondition,
  columnMap?: ApplyFilterOptions['columnMap'],
): Record<string, MikroOrmQueryValue> {
  // Check for column map callback
  if (columnMap && condition.field in columnMap) {
    const mapping = columnMap[condition.field];
    if (typeof mapping === 'function') {
      return mapping(condition.operator, condition.values);
    }
  }

  // Resolve column name
  const mappedColumn = columnMap?.[condition.field];
  const column = typeof mappedColumn === 'string' ? mappedColumn : condition.field;

  const { values, operator } = condition;
  const opMapping = getMikroOrmOperator(operator);

  type ScalarFilterValue = { type: 'string'; value: string } | { type: 'number'; value: number } | { type: 'boolean'; value: boolean };

  const nullValues = values.filter((v) => v.type === 'null');
  const scalarValues = values.filter((v): v is ScalarFilterValue => v.type !== 'null');

  // All null
  if (scalarValues.length === 0 && nullValues.length > 0) {
    return { [column]: { [opMapping.key]: null } };
  }

  // Multi-value: $in / $nin
  if (scalarValues.length > 1) {
    const vals = scalarValues.map((v) => v.value);
    const inKey = opMapping.key === '$ne' ? '$nin' : '$in';

    if (nullValues.length > 0) {
      return {
        $or: [
          { [column]: { [inKey]: vals } },
          { [column]: { $eq: null } },
        ],
      };
    }
    return { [column]: { [inKey]: vals } };
  }

  // Single value
  const rawValue = scalarValues.length > 0 ? scalarValues[0].value : null;
  let paramValue: string | number | boolean | null = rawValue;

  if (opMapping.like && typeof rawValue === 'string') {
    paramValue = wrapLikeValue(rawValue, opMapping.like);
  }

  if (nullValues.length > 0 && rawValue !== null) {
    return {
      $or: [
        { [column]: { [opMapping.key]: paramValue } },
        { [column]: { $eq: null } },
      ],
    };
  }

  if (opMapping.negate) {
    return { [column]: { $not: { [opMapping.key]: paramValue } } };
  }

  return { [column]: { [opMapping.key]: paramValue } };
}
