import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { parseFilter } from '../parse';
import { validateFilter } from '../validate';
import { getFilterableMetadata, getSortableMetadata, isFilterable } from '../decorators/metadata';
import { FilterParseException } from '../errors/filter-parse-exception';
import { FilterResult, FilterTree, ColumnMetadata, SortableColumnMetadata } from '../types';
import type { SortEntry } from '../types';
import { buildSwaggerDescription, buildSortSwaggerDescription } from '../swagger/swagger.util';
import { parseSortString } from '../sort/sort-parser';
import { validateSort } from '../sort/sort-validator';

export interface FilterOptions {
  queryParam?: string;
  sortParam?: string;
  optional?: boolean;
}

/**
 * Attempts to use class-transformer's plainToInstance for type coercion.
 * Falls back to raw object copy if class-transformer is not available.
 */
function transformQuery(
  queryClass: Function,
  rawQuery: Record<string, string | string[] | undefined>,
  excludeKeys: Set<string>,
): Record<string, string | string[] | undefined> {
  const plain: Record<string, string | string[] | undefined> = {};
  for (const [key, value] of Object.entries(rawQuery)) {
    if (!excludeKeys.has(key)) {
      plain[key] = value;
    }
  }

  try {
    const { plainToInstance } = require('class-transformer');
    return plainToInstance(queryClass, plain, { enableImplicitConversion: true });
  } catch {
    return plain;
  }
}

function createFilterDecorator(queryClass: Function, options: FilterOptions = {}) {
  if (!isFilterable(queryClass)) {
    throw new Error(
      `Class '${queryClass.name}' is not decorated with @Filterable(). ` +
      `Add @Filterable() to the class declaration.`,
    );
  }

  const metadata: ColumnMetadata[] = getFilterableMetadata(queryClass);
  const sortableMetadata: SortableColumnMetadata[] = getSortableMetadata(queryClass);
  const filterableKeys = new Set(metadata.map((m) => m.propertyKey));
  const paramName = options.queryParam ?? 'filter';
  const sortParamName = options.sortParam ?? 'sort';
  const isOptional = options.optional ?? false;

  return createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): FilterResult<Record<string, string | string[] | undefined>> => {
      const request = ctx.switchToHttp().getRequest();
      const queryParams: Record<string, string | string[] | undefined> = request.query ?? {};
      const filterString: string | undefined = queryParams[paramName] as string | undefined;
      const sortString: string | undefined = queryParams[sortParamName] as string | undefined;

      // Handle filter
      let filter: FilterTree | undefined;
      if (!filterString || filterString.trim() === '') {
        if (!isOptional) {
          throw new BadRequestException({
            message: `Missing required query parameter '${paramName}'`,
          });
        }
        filter = undefined;
      } else {
        const tree = parseFilter(filterString);
        const filterErrors = validateFilter(tree, metadata);
        if (filterErrors.length > 0) {
          throw new FilterParseException(filterErrors);
        }
        filter = tree;
      }

      // Handle sort — only if the query class has @SortableColumn decorators
      let sort: SortEntry[] | undefined;
      if (sortableMetadata.length > 0 && sortString && sortString.trim() !== '') {
        const sortEntries = parseSortString(sortString);
        const sortErrors = validateSort(sortEntries, sortableMetadata);
        if (sortErrors.length > 0) {
          throw new FilterParseException(sortErrors);
        }
        sort = sortEntries;
      }
      // If no @SortableColumn decorators, sort param is ignored (sort remains undefined)

      // Exclude filter, sort, and filterable column params from query
      const excludeKeys = new Set([...filterableKeys, paramName, sortParamName]);

      return {
        filter,
        sort,
        query: transformQuery(queryClass, queryParams, excludeKeys),
      };
    },
  )();
}

/**
 * Applies @ApiQuery swagger metadata for filter and sort params.
 */
function applySwaggerMetadata(
  metadata: ColumnMetadata[],
  sortableMetadata: SortableColumnMetadata[],
  paramName: string,
  sortParamName: string,
  isOptional: boolean,
  target: object,
  propertyKey: string | symbol,
): void {
  try {
    const { ApiQuery } = require('@nestjs/swagger');
    if (ApiQuery) {
      // Filter query param description
      const filterDescription = buildSwaggerDescription(metadata);
      const filterDecorator = ApiQuery({
        name: paramName,
        required: !isOptional,
        description: filterDescription,
        type: String,
      });
      filterDecorator(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);

      // Sort query param description (only if sortable columns exist)
      if (sortableMetadata.length > 0) {
        const sortDescription = buildSortSwaggerDescription(sortableMetadata);
        const sortDecorator = ApiQuery({
          name: sortParamName,
          required: false,
          description: sortDescription,
          type: String,
        });
        sortDecorator(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
      }
    }
  } catch {
    // @nestjs/swagger not installed — no-op
  }
}

export function Filter(queryClass: Function, options: FilterOptions = {}): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;

    const metadata: ColumnMetadata[] = getFilterableMetadata(queryClass);
    const sortableMetadata: SortableColumnMetadata[] = getSortableMetadata(queryClass);
    const paramName = options.queryParam ?? 'filter';
    const sortParamName = options.sortParam ?? 'sort';
    const isOptional = options.optional ?? false;

    // Apply swagger metadata
    applySwaggerMetadata(metadata, sortableMetadata, paramName, sortParamName, isOptional, target, propertyKey);

    // Apply the param decorator
    const paramDecorator = createFilterDecorator(queryClass, options);
    paramDecorator(target, propertyKey, parameterIndex);
  };
}
