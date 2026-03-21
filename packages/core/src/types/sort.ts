export enum SortDirection {
  /** Ascending (+field or field) */
  asc = 'asc',
  /** Descending (-field) */
  desc = 'desc',
}

export interface SortEntry {
  field: string;
  direction: SortDirection;
}

/** Metadata stored per sortable column by @SortableColumn */
export interface SortableColumnMetadata {
  propertyKey: string;
}
