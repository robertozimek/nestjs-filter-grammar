import { describe, it, expect } from 'vitest';
import { field } from '../src/field';

describe('field', () => {
  it('creates eq method for = operator', () => {
    const f = field<string>('status', ['=']);
    expect(f.eq('active').build()).toBe('status=active');
  });

  it('creates multi-value eq', () => {
    const f = field<string>('status', ['=']);
    expect(f.eq('active', 'pending').build()).toBe('status=active,pending');
  });

  it('creates null eq', () => {
    const f = field<string>('email', ['=']);
    expect(f.eq(null).build()).toBe('email=null');
  });

  it('creates gte method for >= operator', () => {
    const f = field<number>('age', ['>=']);
    expect(f.gte(18).build()).toBe('age>=18');
  });

  it('creates iContains method for *~ operator', () => {
    const f = field<string>('name', ['*~']);
    expect(f.iContains('john').build()).toBe('name*~john');
  });

  it('only includes methods for allowed operators', () => {
    const f = field<string>('status', ['=', '!=']);
    expect(f).toHaveProperty('eq');
    expect(f).toHaveProperty('neq');
    expect(f).not.toHaveProperty('gte');
    expect(f).not.toHaveProperty('contains');
  });
});
