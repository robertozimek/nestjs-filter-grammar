import { describe, it, expect } from 'vitest';
import { Condition, CompoundCondition } from '../src/condition';

describe('Condition', () => {
  it('builds simple equality', () => {
    expect(new Condition('status', '=', ['active']).build()).toBe('status=active');
  });

  it('builds multi-value', () => {
    expect(new Condition('status', '=', ['active', 'pending']).build()).toBe('status=active,pending');
  });

  it('builds null value', () => {
    expect(new Condition('email', '=', [null]).build()).toBe('email=null');
  });

  it('builds comparison', () => {
    expect(new Condition('age', '>=', [30]).build()).toBe('age>=30');
  });

  it('escapes special characters in values', () => {
    expect(new Condition('name', '=', ['Smith, Jr.']).build()).toBe('name="Smith, Jr."');
  });
});

describe('CompoundCondition', () => {
  it('builds AND', () => {
    const a = new Condition('status', '=', ['active']);
    const b = new Condition('age', '>=', [18]);
    expect(new CompoundCondition('AND', [a, b]).build()).toBe('status=active;age>=18');
  });

  it('builds OR', () => {
    const a = new Condition('status', '=', ['active']);
    const b = new Condition('status', '=', ['pending']);
    expect(new CompoundCondition('OR', [a, b]).build()).toBe('status=active|status=pending');
  });

  it('wraps nested OR inside AND with parentheses', () => {
    const orGroup = new CompoundCondition('OR', [
      new Condition('status', '=', ['active']),
      new Condition('status', '=', ['pending']),
    ]);
    const andGroup = new CompoundCondition('AND', [
      orGroup,
      new Condition('age', '>=', [18]),
    ]);
    expect(andGroup.build()).toBe('(status=active|status=pending);age>=18');
  });

  it('wraps nested AND inside OR with parentheses', () => {
    const andGroup = new CompoundCondition('AND', [
      new Condition('status', '=', ['active']),
      new Condition('age', '>=', [18]),
    ]);
    const orGroup = new CompoundCondition('OR', [
      new Condition('name', '=', ['admin']),
      andGroup,
    ]);
    expect(orGroup.build()).toBe('name=admin|(status=active;age>=18)');
  });

  it('single child unwraps', () => {
    const a = new Condition('status', '=', ['active']);
    expect(new CompoundCondition('AND', [a]).build()).toBe('status=active');
  });
});
