import { describe, it, expect } from 'vitest';
import { parseFilter } from '../src/parse';
import { FilterOperator, FilterCondition, FilterGroup } from '../src/types';
import { FilterParseException } from '../src/errors/filter-parse-exception';

describe('parseFilter', () => {
  it('parses a simple condition', () => {
    const result = parseFilter('status=active') as FilterCondition;
    expect(result).toMatchObject({
      field: 'status',
      operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'active' }],
      fieldOffset: 0,
      operatorOffset: 6,
    });
  });

  it('parses complex expression with AND and OR', () => {
    const result = parseFilter('status=active;age>=18|type=admin') as FilterGroup;
    expect(result.type).toBe('OR');
    expect(result.conditions).toHaveLength(2);

    const andGroup = result.conditions[0] as FilterGroup;
    expect(andGroup.type).toBe('AND');
    expect((andGroup.conditions[0] as FilterCondition).field).toBe('status');
    expect((andGroup.conditions[1] as FilterCondition).field).toBe('age');

    const orCondition = result.conditions[1] as FilterCondition;
    expect(orCondition.field).toBe('type');
  });

  it('parses multi-value with null', () => {
    const result = parseFilter('status=null,inactive') as FilterCondition;
    expect(result.values).toEqual([
      { type: 'null' },
      { type: 'string', value: 'inactive' },
    ]);
  });

  it('throws FilterParseException on lexer error', () => {
    expect(() => parseFilter('field="unterminated')).toThrow();
  });

  it('throws FilterParseException on parser error', () => {
    expect(() => parseFilter('field=')).toThrow();
  });

  it('includes error position info', () => {
    try {
      parseFilter('=value');
      expect.fail('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(FilterParseException);
      const ex = e as FilterParseException;
      expect(ex.errors).toBeDefined();
      expect(ex.errors.length).toBeGreaterThan(0);
      expect(ex.errors[0]).toHaveProperty('offset');
      expect(ex.errors[0]).toHaveProperty('message');
    }
  });
});
