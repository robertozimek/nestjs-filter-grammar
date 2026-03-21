import { describe, it, expect } from 'vitest';
import { resolveNames } from '../../src/cli/name-resolver';

describe('resolveNames', () => {
  it('derives name from simple path', () => {
    const result = resolveNames(['/users']);
    expect(result.get('/users')).toBe('Users');
  });

  it('derives name from nested path', () => {
    const result = resolveNames(['/api/v1/orders']);
    expect(result.get('/api/v1/orders')).toBe('Orders');
  });

  it('strips path params', () => {
    const result = resolveNames(['/orders/{id}/items']);
    expect(result.get('/orders/{id}/items')).toBe('Items');
  });

  it('handles collisions with Fields suffix', () => {
    const result = resolveNames(['/users', '/api/users']);
    const values = [...result.values()];
    expect(values).toContain('Users');
    expect(values).toContain('UsersFields');
  });

  it('handles root path', () => {
    const result = resolveNames(['/']);
    expect(result.get('/')).toBe('Root');
  });

  it('PascalCases multi-segment paths', () => {
    const result = resolveNames(['/user-profiles']);
    expect(result.get('/user-profiles')).toBe('UserProfiles');
  });
});
