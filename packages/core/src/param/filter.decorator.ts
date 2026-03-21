import { createParamDecorator, ExecutionContext, BadRequestException } from '@nestjs/common';
import { parseFilter } from '../parse';
import { validateFilter } from '../validate';
import { getFilterableMetadata, isFilterable } from '../decorators/metadata';
import { FilterParseException } from '../errors/filter-parse-exception';
import { FilterResult, ColumnMetadata } from '../types';
import { buildSwaggerDescription } from '../swagger/swagger.util';

export interface FilterOptions {
  queryParam?: string;
  optional?: boolean;
}

/**
 * Attempts to use class-transformer's plainToInstance for type coercion.
 * Falls back to raw object copy if class-transformer is not available.
 */
function transformQuery(
  queryClass: Function,
  rawQuery: Record<string, any>,
  filterableKeys: Set<string>,
  filterParamName: string,
): Record<string, any> {
  // Extract only non-filter, non-filterable-column params
  const plain: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawQuery)) {
    if (key !== filterParamName && !filterableKeys.has(key)) {
      plain[key] = value;
    }
  }

  try {
    const { plainToInstance } = require('class-transformer');
    return plainToInstance(queryClass, plain, { enableImplicitConversion: true });
  } catch {
    // class-transformer not available — return raw values
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
  const filterableKeys = new Set(metadata.map((m) => m.propertyKey));
  const paramName = options.queryParam ?? 'filter';
  const isOptional = options.optional ?? false;

  return createParamDecorator(
    (_data: unknown, ctx: ExecutionContext): FilterResult<any> => {
      const request = ctx.switchToHttp().getRequest();
      const queryParams = request.query ?? {};
      const filterString: string | undefined = queryParams[paramName];

      // Handle missing/empty filter
      if (!filterString || filterString.trim() === '') {
        if (!isOptional) {
          throw new BadRequestException({
            message: `Missing required query parameter '${paramName}'`,
          });
        }
        return {
          filter: undefined,
          query: transformQuery(queryClass, queryParams, filterableKeys, paramName),
        };
      }

      // Parse
      const tree = parseFilter(filterString);

      // Validate against metadata
      const errors = validateFilter(tree, metadata);
      if (errors.length > 0) {
        throw new FilterParseException(errors);
      }

      return {
        filter: tree,
        query: transformQuery(queryClass, queryParams, filterableKeys, paramName),
      };
    },
  )();
}

/**
 * Applies @ApiQuery swagger metadata to the method descriptor if @nestjs/swagger is available.
 */
function applySwaggerMetadata(
  metadata: ColumnMetadata[],
  paramName: string,
  isOptional: boolean,
  target: object,
  propertyKey: string | symbol,
): void {
  try {
    const { ApiQuery } = require('@nestjs/swagger');
    if (ApiQuery) {
      const description = buildSwaggerDescription(metadata);
      const decorator = ApiQuery({
        name: paramName,
        required: !isOptional,
        description,
        type: String,
      });
      decorator(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
    }
  } catch {
    // @nestjs/swagger not installed — no-op
  }
}

export function Filter(queryClass: Function, options: FilterOptions = {}): ParameterDecorator {
  return (target: object, propertyKey: string | symbol | undefined, parameterIndex: number) => {
    if (!propertyKey) return;

    const metadata: ColumnMetadata[] = getFilterableMetadata(queryClass);
    const paramName = options.queryParam ?? 'filter';
    const isOptional = options.optional ?? false;

    // Apply swagger metadata to the method
    applySwaggerMetadata(metadata, paramName, isOptional, target, propertyKey);

    // Apply the param decorator
    const paramDecorator = createFilterDecorator(queryClass, options);
    paramDecorator(target, propertyKey, parameterIndex);
  };
}
