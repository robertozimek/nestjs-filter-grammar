import type {
  FilterTree,
  FilterCondition,
  FilterGroup,
} from '@nestjs-filter-grammar/core';
import { getPrismaOperator } from './operators';
import type { ApplyFilterOptions, PrismaColumnMapFn, PrismaQueryValue } from './types';

export function applyFilter(
  tree: FilterTree,
  options?: ApplyFilterOptions,
): Record<string, PrismaQueryValue> {
  return buildNode(tree, options?.columnMap);
}

function buildNode(
  node: FilterTree,
  columnMap?: ApplyFilterOptions['columnMap'],
): Record<string, PrismaQueryValue> {
  if ('field' in node) {
    return buildCondition(node, columnMap);
  }
  return buildGroup(node, columnMap);
}

function buildGroup(
  group: FilterGroup,
  columnMap?: ApplyFilterOptions['columnMap'],
): Record<string, PrismaQueryValue> {
  const children = group.conditions.map((c) => buildNode(c, columnMap));
  return { [group.type]: children };
}

function buildCondition(
  condition: FilterCondition,
  columnMap?: ApplyFilterOptions['columnMap'],
): Record<string, PrismaQueryValue> {
  // Check for column map callback
  if (columnMap && condition.field in columnMap) {
    const mapping = columnMap[condition.field];
    if (typeof mapping === 'function') {
      return (mapping as PrismaColumnMapFn)(condition.operator, condition.values);
    }
  }

  // Resolve column name
  const column = (columnMap && typeof columnMap[condition.field] === 'string')
    ? columnMap[condition.field] as string
    : condition.field;

  const { values, operator } = condition;
  const opMapping = getPrismaOperator(operator);

  const nullValues = values.filter((v) => v.type === 'null');
  const stringValues = values.filter((v): v is { type: 'string'; value: string } => v.type === 'string');

  // All null
  if (stringValues.length === 0 && nullValues.length > 0) {
    if (opMapping.negate) {
      return { [column]: { not: { equals: null } } };
    }
    return { [column]: { equals: null } };
  }

  // Multi-value: IN / NOT IN
  if (stringValues.length > 1) {
    const vals = stringValues.map((v) => v.value);
    const inKey = opMapping.negate ? 'notIn' : 'in';

    if (nullValues.length > 0) {
      return {
        OR: [
          { [column]: { [inKey]: vals } },
          { [column]: { equals: null } },
        ],
      };
    }
    return { [column]: { [inKey]: vals } };
  }

  // Single value
  const rawValue = stringValues.length > 0 ? stringValues[0].value : null;
  let fieldExpr: Record<string, PrismaQueryValue> = { [opMapping.key]: rawValue };

  if (opMapping.insensitive) {
    fieldExpr.mode = 'insensitive';
  }

  if (opMapping.negate) {
    fieldExpr = { not: fieldExpr };
  }

  if (nullValues.length > 0 && rawValue !== null) {
    return {
      OR: [
        { [column]: fieldExpr },
        { [column]: { equals: null } },
      ],
    };
  }

  return { [column]: fieldExpr };
}
