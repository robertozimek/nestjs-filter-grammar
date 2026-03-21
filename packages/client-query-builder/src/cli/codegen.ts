export interface FieldDef {
  operators: string[];
  type: 'string' | 'number' | 'boolean' | 'enum';
  values?: (string | number)[];
}

export interface EndpointDef {
  fields: Record<string, FieldDef>;
  sortable: string[];
}

function typeToGeneric(fieldDef: FieldDef): string {
  if (fieldDef.type === 'enum' && fieldDef.values) {
    return fieldDef.values
      .map((v) => (typeof v === 'string' ? `'${v}'` : String(v)))
      .join(' | ');
  }
  return fieldDef.type;
}

export function generateFile(name: string, endpoint: EndpointDef): string {
  const lines: string[] = [
    "import { field, sortField } from '@nestjs-filter-grammar/client-query-builder';",
    '',
  ];

  lines.push(`export const Filter${name} = {`);
  for (const [fieldName, def] of Object.entries(endpoint.fields)) {
    const generic = typeToGeneric(def);
    const operators = JSON.stringify(def.operators);
    lines.push(`  ${fieldName}: field<${generic}>('${fieldName}', ${operators}),`);
  }
  lines.push('} as const;');

  if (endpoint.sortable.length > 0) {
    lines.push('');
    lines.push(`export const Sort${name} = {`);
    for (const fieldName of endpoint.sortable) {
      lines.push(`  ${fieldName}: sortField('${fieldName}'),`);
    }
    lines.push('} as const;');
  }

  lines.push('');
  return lines.join('\n');
}

export interface BarrelEntry {
  filename: string;
  name: string;
  hasFilter: boolean;
  hasSort: boolean;
}

export function generateBarrel(entries: BarrelEntry[]): string {
  const lines: string[] = [];
  for (const entry of entries) {
    const exports: string[] = [];
    if (entry.hasFilter) exports.push(`Filter${entry.name}`);
    if (entry.hasSort) exports.push(`Sort${entry.name}`);
    if (exports.length > 0) {
      lines.push(`export { ${exports.join(', ')} } from './${entry.filename}';`);
    }
  }
  lines.push('');
  return lines.join('\n');
}
