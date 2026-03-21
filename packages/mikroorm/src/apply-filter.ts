import type {
  FilterTree,
  FilterCondition,
  FilterGroup,
} from '@nestjs-filter-grammar/core';
import { getMikroOrmOperator, wrapLikeValue } from './operators';
import type { ApplyFilterOptions, MikroOrmColumnMapFn, MikroOrmQueryValue } from './types';

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
      return (mapping as MikroOrmColumnMapFn)(condition.operator, condition.values);
    }
  }

  // Resolve column name
  const column = (columnMap && typeof columnMap[condition.field] === 'string')
    ? columnMap[condition.field] as string
    : condition.field;

  const { values, operator } = condition;
  const opMapping = getMikroOrmOperator(operator);

  const nullValues = values.filter((v) => v.type === 'null');
  const stringValues = values.filter((v): v is { type: 'string'; value: string } => v.type === 'string');

  // All null
  if (stringValues.length === 0 && nullValues.length > 0) {
    return { [column]: { [opMapping.key]: null } };
  }

  // Multi-value: $in / $nin
  if (stringValues.length > 1) {
    const vals = stringValues.map((v) => v.value);
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
  const rawValue = stringValues.length > 0 ? stringValues[0].value : null;
  let paramValue: string | null = rawValue;

  if (opMapping.like && rawValue !== null) {
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
