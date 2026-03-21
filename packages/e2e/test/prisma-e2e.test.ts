import { describe, it, expect } from 'vitest';
import { parseFilter, parseSortString } from '@nestjs-filter-grammar/core';
import { applyFilter, applySort } from '@nestjs-filter-grammar/prisma';

/**
 * Prisma adapter produces plain where/orderBy objects.
 * Since Prisma requires schema generation + migrations for SQLite,
 * these tests verify the produced objects match Prisma's expected format.
 */
describe('Prisma E2E — object verification', () => {
  it('produces equals where', () => {
    const where = applyFilter(parseFilter('status=active'));
    expect(where).toEqual({ status: { equals: 'active' } });
  });

  it('produces not-equals where', () => {
    const where = applyFilter(parseFilter('status!=deleted'));
    expect(where).toEqual({ status: { not: { equals: 'deleted' } } });
  });

  it('produces AND where', () => {
    const where = applyFilter(parseFilter('status=active;age>=18'));
    expect(where).toEqual({
      AND: [
        { status: { equals: 'active' } },
        { age: { gte: '18' } },
      ],
    });
  });

  it('produces OR where', () => {
    const where = applyFilter(parseFilter('status=active|status=pending'));
    expect(where).toEqual({
      OR: [
        { status: { equals: 'active' } },
        { status: { equals: 'pending' } },
      ],
    });
  });

  it('produces IN where for multi-value', () => {
    const where = applyFilter(parseFilter('status=active,pending'));
    expect(where).toEqual({ status: { in: ['active', 'pending'] } });
  });

  it('produces case-insensitive contains', () => {
    const where = applyFilter(parseFilter('name*~john'));
    expect(where).toEqual({ name: { contains: 'john', mode: 'insensitive' } });
  });

  it('produces startsWith where', () => {
    const where = applyFilter(parseFilter('name^=Jo'));
    expect(where).toEqual({ name: { startsWith: 'Jo' } });
  });

  it('produces null where', () => {
    const where = applyFilter(parseFilter('email=null'));
    expect(where).toEqual({ email: { equals: null } });
  });

  it('produces comparison operators', () => {
    const where = applyFilter(parseFilter('age>28;age<35'));
    expect(where).toEqual({
      AND: [
        { age: { gt: '28' } },
        { age: { lt: '35' } },
      ],
    });
  });

  it('produces ascending orderBy', () => {
    const orderBy = applySort(parseSortString('+age'));
    expect(orderBy).toEqual([{ age: 'asc' }]);
  });

  it('produces descending orderBy', () => {
    const orderBy = applySort(parseSortString('-age'));
    expect(orderBy).toEqual([{ age: 'desc' }]);
  });

  it('produces multi-field orderBy', () => {
    const orderBy = applySort(parseSortString('+name,-age'));
    expect(orderBy).toEqual([{ name: 'asc' }, { age: 'desc' }]);
  });

  it('produces filter + sort together', () => {
    const where = applyFilter(parseFilter('status=active'));
    const orderBy = applySort(parseSortString('-age'));
    expect(where).toEqual({ status: { equals: 'active' } });
    expect(orderBy).toEqual([{ age: 'desc' }]);
  });
});
