import type {
  FilterTree,
  FilterCondition,
  FilterGroup,
} from '@nestjs-filter-grammar/core';
import { getPrismaOperator } from './operators';
import type { ApplyFilterOptions, PrismaQueryValue } from './types';

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
      return mapping(condition.operator, condition.values);
    }
  }

  // Resolve column name
  const mappedColumn = columnMap?.[condition.field];
  const column = typeof mappedColumn === 'string' ? mappedColumn : condition.field;

  const { values, operator } = condition;
  const opMapping = getPrismaOperator(operator);

  type ScalarFilterValue = { type: 'string'; value: string } | { type: 'number'; value: number } | { type: 'boolean'; value: boolean };

  const nullValues = values.filter((v) => v.type === 'null');
  const scalarValues = values.filter((v): v is ScalarFilterValue => v.type !== 'null');

  // All null
  if (scalarValues.length === 0 && nullValues.length > 0) {
    if (opMapping.negate) {
      return { [column]: { not: { equals: null } } };
    }
    return { [column]: { equals: null } };
  }

  // Multi-value: IN / NOT IN
  if (scalarValues.length > 1) {
    const vals = scalarValues.map((v) => v.value);
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
  const rawValue = scalarValues.length > 0 ? scalarValues[0].value : null;
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
