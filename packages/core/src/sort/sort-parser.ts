import { BadRequestException } from '@nestjs/common';
import { SortEntry, SortDirection } from '../types';

export function parseSortString(input: string): SortEntry[] {
  const trimmed = input.trim();
  if (trimmed === '') {
    return [];
  }

  const entries: SortEntry[] = [];
  const seen = new Set<string>();
  const parts = trimmed.split(',');

  for (const part of parts) {
    const segment = part.trim();
    if (segment === '') {
      throw new BadRequestException({
        message: 'Invalid sort expression: empty field name',
      });
    }

    let direction: SortDirection;
    let field: string;

    if (segment.startsWith('+')) {
      direction = SortDirection.asc;
      field = segment.slice(1).trim();
    } else if (segment.startsWith('-')) {
      direction = SortDirection.desc;
      field = segment.slice(1).trim();
    } else {
      direction = SortDirection.asc;
      field = segment;
    }

    if (field === '') {
      throw new BadRequestException({
        message: 'Invalid sort expression: empty field name',
      });
    }

    if (seen.has(field)) {
      throw new BadRequestException({
        message: `Invalid sort expression: duplicate field '${field}'`,
      });
    }

    seen.add(field);
    entries.push({ field, direction });
  }

  return entries;
}
