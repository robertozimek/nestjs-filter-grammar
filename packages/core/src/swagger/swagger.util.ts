import { ColumnMetadata, SortableColumnMetadata, FilterValueType } from '../types';

export function buildSwaggerDescription(metadata: ColumnMetadata[]): string {
  if (metadata.length === 0) {
    return '';
  }

  const fields = metadata
    .map((col) => {
      const ops = col.operators.map((o) => o).join(', ');
      return `  ${col.propertyKey}: (${ops})`;
    })
    .join('\n');

  return [
    'Filterable Fields:',
    fields,
    '',
    'Syntax:',
    '  AND: field=value;field2=value2',
    '  OR:  field=value|field2=value2',
    '  IN:  field=value1,value2',
    '  Null: field=null',
    '  Group: (expr);(expr)',
  ].join('\n');
}

export function buildSortSwaggerDescription(metadata: SortableColumnMetadata[]): string {
  if (metadata.length === 0) {
    return '';
  }

  const fields = metadata.map((col) => col.propertyKey).join(', ');

  return [
    'Sortable Fields:',
    `  ${fields}`,
    '',
    'Syntax:',
    '  Ascending:  +field (or just field)',
    '  Descending: -field',
    '  Multiple:   +field1,-field2,field3',
  ].join('\n');
}

// --- OpenAPI x-filter-grammar extension ---

export interface FilterGrammarFieldDef {
  operators: string[];
  type: 'string' | 'number' | 'boolean' | 'enum';
  values?: (string | number)[];
}

export interface FilterGrammarExtension {
  filterParam: string;
  sortParam: string;
  fields: Record<string, FilterGrammarFieldDef>;
  sortable: string[];
}

function resolveFieldDef(meta: ColumnMetadata): FilterGrammarFieldDef {
  const operators = meta.operators.map((o) => o as string);
  const valueType = meta.valueType;

  if (valueType === 'string' || valueType === 'number' || valueType === 'boolean') {
    return { operators, type: valueType };
  }

  // Enum: string[] or Record<string, string | number>
  let values: (string | number)[];
  if (Array.isArray(valueType)) {
    values = valueType;
  } else {
    // Filter out reverse-mapped numeric enum keys
    values = Object.entries(valueType)
      .filter(([key]) => isNaN(Number(key)))
      .map(([, value]) => value);
  }

  return { operators, type: 'enum', values };
}

export function buildFilterGrammarExtension(
  metadata: ColumnMetadata[],
  sortableMetadata: SortableColumnMetadata[],
  filterParam: string,
  sortParam: string,
): FilterGrammarExtension {
  const fields: Record<string, FilterGrammarFieldDef> = {};
  for (const meta of metadata) {
    fields[meta.propertyKey] = resolveFieldDef(meta);
  }

  return {
    filterParam,
    sortParam,
    fields,
    sortable: sortableMetadata.map((s) => s.propertyKey),
  };
}
