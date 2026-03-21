import { ColumnMetadata } from '../types';

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
  ].join('\n');
}
