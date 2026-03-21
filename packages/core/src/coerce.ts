import {
  FilterTree,
  FilterCondition,
  FilterGroup,
  FilterValue,
  FilterError,
  ColumnMetadata,
  FilterValueType,
} from './types';

export interface CoerceResult {
  tree: FilterTree;
  errors: FilterError[];
}

export function coerceFilterValues(
  tree: FilterTree,
  metadata: ColumnMetadata[],
): CoerceResult {
  const columnMap = new Map(metadata.map((m) => [m.propertyKey, m]));
  const errors: FilterError[] = [];
  const result = coerceNode(tree, columnMap, errors);
  return { tree: result, errors };
}

function coerceNode(
  node: FilterTree,
  columnMap: Map<string, ColumnMetadata>,
  errors: FilterError[],
): FilterTree {
  if ('field' in node) {
    return coerceCondition(node, columnMap, errors);
  }
  return coerceGroup(node, columnMap, errors);
}

function coerceGroup(
  group: FilterGroup,
  columnMap: Map<string, ColumnMetadata>,
  errors: FilterError[],
): FilterGroup {
  return {
    ...group,
    conditions: group.conditions.map((c) => coerceNode(c, columnMap, errors)),
  };
}

function coerceCondition(
  condition: FilterCondition,
  columnMap: Map<string, ColumnMetadata>,
  errors: FilterError[],
): FilterCondition {
  const meta = columnMap.get(condition.field);
  if (!meta || meta.valueType === 'string') {
    return condition;
  }

  const coercedValues = condition.values.map((v) =>
    coerceValue(v, meta.valueType, condition.field, condition.fieldOffset, errors),
  );

  return { ...condition, values: coercedValues };
}

function coerceValue(
  value: FilterValue,
  targetType: FilterValueType,
  field: string,
  offset: number,
  errors: FilterError[],
): FilterValue {
  if (value.type === 'null') {
    return value;
  }

  // Only coerce unquoted string values
  if (value.type !== 'string' || value.quoted) {
    return value;
  }

  const raw = value.value;

  if (targetType === 'number') {
    const num = Number(raw);
    if (isNaN(num)) {
      errors.push({
        message: `Invalid value '${raw}' for field '${field}': expected a number`,
        offset,
        length: raw.length,
        field,
      });
      return value;
    }
    return { type: 'number', value: num };
  }

  if (targetType === 'boolean') {
    if (raw === 'true') {
      return { type: 'boolean', value: true };
    }
    if (raw === 'false') {
      return { type: 'boolean', value: false };
    }
    errors.push({
      message: `Invalid value '${raw}' for field '${field}': expected a boolean (true or false)`,
      offset,
      length: raw.length,
      field,
    });
    return value;
  }

  return value;
}
