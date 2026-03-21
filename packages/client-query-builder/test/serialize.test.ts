import { describe, it, expect } from 'vitest';
import { serializeValue, operatorSymbol } from '../src/serialize';

describe('serializeValue', () => {
  it('serializes plain string', () => {
    expect(serializeValue('active')).toBe('active');
  });

  it('quotes strings with commas', () => {
    expect(serializeValue('Smith, Jr.')).toBe('"Smith, Jr."');
  });

  it('quotes strings with semicolons', () => {
    expect(serializeValue('a;b')).toBe('"a;b"');
  });

  it('quotes strings with pipes', () => {
    expect(serializeValue('a|b')).toBe('"a|b"');
  });

  it('quotes strings with equals', () => {
    expect(serializeValue('a=b')).toBe('"a=b"');
  });

  it('quotes strings with spaces', () => {
    expect(serializeValue('hello world')).toBe('"hello world"');
  });

  it('escapes quotes inside quoted strings', () => {
    expect(serializeValue('say "hi"')).toBe('"say \\"hi\\""');
  });

  it('escapes backslashes inside quoted strings', () => {
    expect(serializeValue('back\\slash')).toBe('"back\\\\slash"');
  });

  it('serializes null', () => {
    expect(serializeValue(null)).toBe('null');
  });

  it('serializes numbers', () => {
    expect(serializeValue(42)).toBe('42');
    expect(serializeValue(3.14)).toBe('3.14');
    expect(serializeValue(-5)).toBe('-5');
  });

  it('serializes booleans', () => {
    expect(serializeValue(true)).toBe('true');
    expect(serializeValue(false)).toBe('false');
  });
});

describe('operatorSymbol', () => {
  it('maps method names to symbols', () => {
    expect(operatorSymbol('eq')).toBe('=');
    expect(operatorSymbol('neq')).toBe('!=');
    expect(operatorSymbol('gte')).toBe('>=');
    expect(operatorSymbol('iContains')).toBe('*~');
  });
});
