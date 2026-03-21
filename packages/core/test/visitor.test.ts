import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer';
import { FilterParser } from '../src/parser/filter-parser';
import { buildFilterVisitor } from '../src/visitor/filter-visitor';
import { FilterOperator, FilterCondition, FilterGroup } from '../src/types';

const parser = new FilterParser();
const visitor = buildFilterVisitor(parser);

function visit(input: string) {
  const lexResult = tokenize(input);
  parser.input = lexResult.tokens;
  const cst = parser.orExpression();
  expect(parser.errors).toHaveLength(0);
  return visitor.visit(cst);
}

describe('FilterCstVisitor', () => {
  describe('simple conditions', () => {
    it('parses a single equality condition', () => {
      const result = visit('status=active') as FilterCondition;
      expect(result).toMatchObject({
        field: 'status',
        operator: FilterOperator.eq,
        values: [{ type: 'string', value: 'active' }],
        fieldOffset: 0,
        operatorOffset: 6,
      });
    });

    it('parses each operator correctly', () => {
      const cases: Array<[string, FilterOperator]> = [
        ['f=v',  FilterOperator.eq],
        ['f!=v', FilterOperator.neq],
        ['f>v',  FilterOperator.gt],
        ['f<v',  FilterOperator.lt],
        ['f>=v', FilterOperator.gte],
        ['f<=v', FilterOperator.lte],
        ['f~v',  FilterOperator.iEq],
        ['f!~v', FilterOperator.iNeq],
        ['f^=v', FilterOperator.startsWith],
        ['f$=v', FilterOperator.endsWith],
        ['f*=v', FilterOperator.contains],
        ['f^~v', FilterOperator.iStartsWith],
        ['f$~v', FilterOperator.iEndsWith],
        ['f*~v', FilterOperator.iContains],
      ];
      for (const [input, expectedOp] of cases) {
        const result = visit(input) as FilterCondition;
        expect(result.operator, `Failed for input: ${input}`).toBe(expectedOp);
      }
    });
  });

  describe('values', () => {
    it('parses comma-separated values', () => {
      const result = visit('status=active,pending') as FilterCondition;
      expect(result.values).toEqual([
        { type: 'string', value: 'active' },
        { type: 'string', value: 'pending' },
      ]);
    });

    it('parses null value', () => {
      const result = visit('status=null') as FilterCondition;
      expect(result.values).toEqual([{ type: 'null' }]);
    });

    it('parses null with other values', () => {
      const result = visit('status=null,active') as FilterCondition;
      expect(result.values).toEqual([
        { type: 'null' },
        { type: 'string', value: 'active' },
      ]);
    });

    it('parses string literals and strips quotes', () => {
      const result = visit('name="John Doe"') as FilterCondition;
      expect(result.values).toEqual([
        { type: 'string', value: 'John Doe' },
      ]);
    });

    it('unescapes quotes in string literals', () => {
      const result = visit('name="say \\"hi\\""') as FilterCondition;
      expect(result.values).toEqual([
        { type: 'string', value: 'say "hi"' },
      ]);
    });

    it('unescapes backslashes in string literals', () => {
      const result = visit('path="C:\\\\Users"') as FilterCondition;
      expect(result.values).toEqual([
        { type: 'string', value: 'C:\\Users' },
      ]);
    });
  });

  describe('AND expressions', () => {
    it('returns FilterGroup with type AND', () => {
      const result = visit('a=1;b=2') as FilterGroup;
      expect(result.type).toBe('AND');
      expect(result.conditions).toHaveLength(2);
    });
  });

  describe('OR expressions', () => {
    it('returns FilterGroup with type OR', () => {
      const result = visit('a=1|b=2') as FilterGroup;
      expect(result.type).toBe('OR');
      expect(result.conditions).toHaveLength(2);
    });
  });

  describe('precedence', () => {
    it('AND binds tighter than OR', () => {
      const result = visit('a=1;b=2|c=3') as FilterGroup;
      expect(result.type).toBe('OR');
      expect(result.conditions).toHaveLength(2);

      const andGroup = result.conditions[0] as FilterGroup;
      expect(andGroup.type).toBe('AND');
      expect(andGroup.conditions).toHaveLength(2);

      const cCondition = result.conditions[1] as FilterCondition;
      expect(cCondition.field).toBe('c');
    });
  });

  describe('tree simplification', () => {
    it('unwraps single condition (no group wrapper)', () => {
      const result = visit('status=active');
      expect(result).not.toHaveProperty('type', 'OR');
      expect(result).not.toHaveProperty('type', 'AND');
      expect(result).toHaveProperty('field', 'status');
    });

    it('keeps AND group for multiple AND conditions', () => {
      const result = visit('a=1;b=2') as FilterGroup;
      expect(result.type).toBe('AND');
    });

    it('unwraps single OR branch with single condition', () => {
      const result = visit('a=1');
      expect(result).toHaveProperty('field', 'a');
    });
  });
});
