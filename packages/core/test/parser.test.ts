import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer';
import { FilterParser } from '../src/parser/filter-parser';

const parser = new FilterParser();

function parse(input: string) {
  const lexResult = tokenize(input);
  parser.input = lexResult.tokens;
  const cst = parser.orExpression();
  return { cst, errors: parser.errors };
}

describe('Parser', () => {
  it('parses a simple condition', () => {
    const { cst, errors } = parse('status=active');
    expect(errors).toHaveLength(0);
    expect(cst).toBeDefined();
  });

  it('parses AND expression with semicolon', () => {
    const { cst, errors } = parse('status=active;age>=18');
    expect(errors).toHaveLength(0);
    expect(cst.children.andExpression).toHaveLength(1);
  });

  it('parses OR expression with pipe', () => {
    const { cst, errors } = parse('status=active|type=admin');
    expect(errors).toHaveLength(0);
    expect(cst.children.andExpression).toHaveLength(2);
  });

  it('parses mixed AND/OR with correct precedence', () => {
    const { cst, errors } = parse('a=1;b=2|c=3');
    expect(errors).toHaveLength(0);
    expect(cst.children.andExpression).toHaveLength(2);
  });

  it('parses comma-separated values', () => {
    const { cst, errors } = parse('status=active,pending,archived');
    expect(errors).toHaveLength(0);
  });

  it('parses string literals as values', () => {
    const { cst, errors } = parse('name="John Doe"');
    expect(errors).toHaveLength(0);
  });

  it('parses null as a value', () => {
    const { cst, errors } = parse('status=null');
    expect(errors).toHaveLength(0);
  });

  it('parses null with other values', () => {
    const { cst, errors } = parse('status=null,active');
    expect(errors).toHaveLength(0);
  });

  it('parses all operator types', () => {
    const ops = ['=', '!=', '>', '<', '>=', '<=', '~', '!~', '^=', '$=', '*=', '^~', '$~', '*~'];
    for (const op of ops) {
      const { errors } = parse(`field${op}value`);
      expect(errors, `Failed for operator: ${op}`).toHaveLength(0);
    }
  });

  it('reports error for missing value', () => {
    const { errors } = parse('status=');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('reports error for missing operator', () => {
    const { errors } = parse('status active');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('reports error for missing field', () => {
    const { errors } = parse('=active');
    expect(errors.length).toBeGreaterThan(0);
  });

  it('reports error when null is used as a field name', () => {
    const { errors } = parse('null=active');
    expect(errors.length).toBeGreaterThan(0);
  });
});
