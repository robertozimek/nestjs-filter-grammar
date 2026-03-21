import { describe, it, expect } from 'vitest';
import { and, or } from '../src/combinators';
import { Condition } from '../src/condition';

describe('and', () => {
  it('combines conditions with AND', () => {
    const result = and(
      new Condition('a', '=', ['1']),
      new Condition('b', '=', ['2']),
    );
    expect(result.build()).toBe('a=1;b=2');
  });
});

describe('or', () => {
  it('combines conditions with OR', () => {
    const result = or(
      new Condition('a', '=', ['1']),
      new Condition('b', '=', ['2']),
    );
    expect(result.build()).toBe('a=1|b=2');
  });
});

describe('nested', () => {
  it('and(a, or(b, c))', () => {
    const result = and(
      new Condition('a', '=', ['1']),
      or(
        new Condition('b', '=', ['2']),
        new Condition('c', '=', ['3']),
      ),
    );
    expect(result.build()).toBe('a=1;(b=2|c=3)');
  });

  it('or(a, and(b, c))', () => {
    const result = or(
      new Condition('a', '=', ['1']),
      and(
        new Condition('b', '=', ['2']),
        new Condition('c', '=', ['3']),
      ),
    );
    expect(result.build()).toBe('a=1|(b=2;c=3)');
  });

  it('deeply nested', () => {
    const result = and(
      or(
        new Condition('a', '=', ['1']),
        new Condition('b', '=', ['2']),
      ),
      or(
        new Condition('c', '=', ['3']),
        new Condition('d', '=', ['4']),
      ),
    );
    expect(result.build()).toBe('(a=1|b=2);(c=3|d=4)');
  });
});
