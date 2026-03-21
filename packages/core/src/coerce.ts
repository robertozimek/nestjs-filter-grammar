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

function isEnumType(valueType: FilterValueType): valueType is (string | number)[] | Record<string, string | number> {
  return typeof valueType === 'object';
}

function resolveEnumValues(valueType: (string | number)[] | Record<string, string | number>): (string | number)[] {
  if (Array.isArray(valueType)) return valueType;
  // For TS numeric enums, Object.values returns both forward and reverse mappings:
  //   enum E { a=0 } → { a: 0, '0': 'a' } → Object.values = ['a', 0]
  // We want the values that were explicitly assigned (the non-reverse-mapped ones).
  // The forward mapping has string keys → string|number values.
  // The reverse mapping has numeric-string keys → string values.
  // Keep only values from non-numeric keys (the forward mappings).
  const entries = Object.entries(valueType);
  return entries
    .filter(([key]) => isNaN(Number(key)))
    .map(([, value]) => value);
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

  if (isEnumType(meta.valueType)) {
    const allowed = resolveEnumValues(meta.valueType);
    return validateEnum(condition, allowed, errors);
  }

  const coercedValues = condition.values.map((v) =>
    coerceValue(v, meta.valueType as 'number' | 'boolean', condition.field, condition.fieldOffset, errors),
  );

  return { ...condition, values: coercedValues };
}

function validateEnum(
  condition: FilterCondition,
  allowed: (string | number)[],
  errors: FilterError[],
): FilterCondition {
  const coercedValues: FilterValue[] = [];

  for (const v of condition.values) {
    if (v.type === 'null') {
      coercedValues.push(v);
      continue;
    }
    if (v.type !== 'string') {
      coercedValues.push(v);
      continue;
    }

    const raw = v.value;

    // Check if the raw string matches a string enum value
    if (allowed.includes(raw)) {
      coercedValues.push(v);
      continue;
    }

    // Check if it matches a numeric enum value
    const num = Number(raw);
    if (!isNaN(num) && allowed.includes(num)) {
      coercedValues.push({ type: 'number', value: num });
      continue;
    }

    errors.push({
      message: `Invalid value '${raw}' for field '${condition.field}': expected one of ${allowed.join(', ')}`,
      offset: condition.fieldOffset,
      length: raw.length,
      field: condition.field,
    });
    coercedValues.push(v);
  }

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
