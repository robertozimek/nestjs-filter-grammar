import { SortEntry, SortableColumnMetadata, FilterError } from '../types';

export function validateSort(
  entries: SortEntry[],
  metadata: SortableColumnMetadata[],
): FilterError[] {
  const errors: FilterError[] = [];
  const sortableFields = new Set(metadata.map((m) => m.propertyKey));

  for (const entry of entries) {
    if (!sortableFields.has(entry.field)) {
      errors.push({
        message: `Unknown sortable field '${entry.field}'`,
        offset: 0,
        length: entry.field.length,
        field: entry.field,
      });
    }
  }

  return errors;
}
