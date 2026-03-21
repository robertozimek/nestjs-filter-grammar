import { describe, it, expect } from 'vitest';
import { sortField, sort } from '../src/sort';

describe('sortField', () => {
  it('builds ascending', () => {
    expect(sortField('name').asc().build()).toBe('+name');
  });

  it('builds descending', () => {
    expect(sortField('name').desc().build()).toBe('-name');
  });
});

describe('sort', () => {
  it('combines sort expressions', () => {
    const result = sort(sortField('name').asc(), sortField('age').desc());
    expect(result.build()).toBe('+name,-age');
  });

  it('single sort', () => {
    expect(sort(sortField('name').asc()).build()).toBe('+name');
  });
});
