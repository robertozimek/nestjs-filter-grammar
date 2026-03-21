import {
  FilterTree,
  FilterCondition,
  FilterGroup,
  FilterError,
  ColumnMetadata,
  EQUALITY_OPERATORS,
} from './types';

export function validateFilter(
  tree: FilterTree,
  metadata: ColumnMetadata[],
): FilterError[] {
  const errors: FilterError[] = [];
  const columnMap = new Map(metadata.map((m) => [m.propertyKey, m]));

  collectErrors(tree, columnMap, errors);
  return errors;
}

function collectErrors(
  node: FilterTree,
  columnMap: Map<string, ColumnMetadata>,
  errors: FilterError[],
): void {
  if ('field' in node) {
    validateCondition(node as FilterCondition, columnMap, errors);
  } else {
    for (const child of (node as FilterGroup).conditions) {
      collectErrors(child, columnMap, errors);
    }
  }
}

function validateCondition(
  condition: FilterCondition,
  columnMap: Map<string, ColumnMetadata>,
  errors: FilterError[],
): void {
  const meta = columnMap.get(condition.field);

  if (!meta) {
    errors.push({
      message: `Unknown filterable field '${condition.field}'`,
      offset: condition.fieldOffset,
      length: condition.field.length,
      field: condition.field,
    });
    return;
  }

  if (!meta.operators.includes(condition.operator)) {
    const allowed = meta.operators.join(', ');
    errors.push({
      message: `Operator '${condition.operator}' is not allowed for field '${condition.field}'. Allowed operators: ${allowed}`,
      offset: condition.operatorOffset,
      length: condition.operator.length,
      field: condition.field,
      operator: condition.operator,
    });
    return;
  }

  if (condition.values.length > 1 && !EQUALITY_OPERATORS.has(condition.operator)) {
    errors.push({
      message: `Field '${condition.field}' with operator '${condition.operator}' does not support multiple values. Multi-value is only allowed with: =, !=, ~, !~`,
      offset: condition.fieldOffset,
      length: 0,
      field: condition.field,
      operator: condition.operator,
    });
  }
}
