import { describe, it, expect } from 'vitest';
import { coerceFilterValues } from '../src/coerce';
import { FilterOperator, FilterCondition, FilterGroup, ColumnMetadata } from '../src/types';

const metadata: ColumnMetadata[] = [
  { propertyKey: 'name', operators: [FilterOperator.eq], valueType: 'string' },
  { propertyKey: 'age', operators: [FilterOperator.eq, FilterOperator.gte, FilterOperator.lte], valueType: 'number' },
  { propertyKey: 'active', operators: [FilterOperator.eq], valueType: 'boolean' },
];

describe('coerceFilterValues', () => {
  it('leaves string values unchanged', () => {
    const tree: FilterCondition = {
      field: 'name', operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'Alice' }],
      fieldOffset: 0, operatorOffset: 4,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'string', value: 'Alice' });
  });

  it('coerces string to number', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.gte,
      values: [{ type: 'string', value: '30' }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'number', value: 30 });
  });

  it('coerces decimal number', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.gte,
      values: [{ type: 'string', value: '3.14' }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'number', value: 3.14 });
  });

  it('coerces negative number', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.gte,
      values: [{ type: 'string', value: '-5' }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'number', value: -5 });
  });

  it('returns error for non-numeric value on number column', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'abc' }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('abc');
    expect(errors[0].message).toContain('number');
    expect(errors[0].field).toBe('age');
  });

  it('coerces "true" to boolean', () => {
    const tree: FilterCondition = {
      field: 'active', operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'true' }],
      fieldOffset: 0, operatorOffset: 6,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'boolean', value: true });
  });

  it('coerces "false" to boolean', () => {
    const tree: FilterCondition = {
      field: 'active', operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'false' }],
      fieldOffset: 0, operatorOffset: 6,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'boolean', value: false });
  });

  it('returns error for non-boolean value on boolean column', () => {
    const tree: FilterCondition = {
      field: 'active', operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'maybe' }],
      fieldOffset: 0, operatorOffset: 6,
    };
    const { errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toContain('maybe');
    expect(errors[0].message).toContain('boolean');
  });

  it('preserves null values unchanged', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.eq,
      values: [{ type: 'null' }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'null' });
  });

  it('coerces multi-value number list', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.eq,
      values: [{ type: 'string', value: '25' }, { type: 'string', value: '30' }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    const cond = result as FilterCondition;
    expect(cond.values[0]).toEqual({ type: 'number', value: 25 });
    expect(cond.values[1]).toEqual({ type: 'number', value: 30 });
  });

  it('walks AND groups', () => {
    const tree: FilterGroup = {
      type: 'AND',
      conditions: [
        { field: 'name', operator: FilterOperator.eq, values: [{ type: 'string', value: 'Alice' }], fieldOffset: 0, operatorOffset: 4 },
        { field: 'age', operator: FilterOperator.gte, values: [{ type: 'string', value: '30' }], fieldOffset: 10, operatorOffset: 13 },
      ],
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    const group = result as FilterGroup;
    expect((group.conditions[0] as FilterCondition).values[0]).toEqual({ type: 'string', value: 'Alice' });
    expect((group.conditions[1] as FilterCondition).values[0]).toEqual({ type: 'number', value: 30 });
  });

  it('skips fields not in metadata', () => {
    const tree: FilterCondition = {
      field: 'unknown', operator: FilterOperator.eq,
      values: [{ type: 'string', value: 'test' }],
      fieldOffset: 0, operatorOffset: 7,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'string', value: 'test' });
  });

  it('does not coerce quoted string values on number columns', () => {
    const tree: FilterCondition = {
      field: 'age', operator: FilterOperator.eq,
      values: [{ type: 'string', value: '123', quoted: true }],
      fieldOffset: 0, operatorOffset: 3,
    };
    const { tree: result, errors } = coerceFilterValues(tree, metadata);
    expect(errors).toHaveLength(0);
    expect((result as FilterCondition).values[0]).toEqual({ type: 'string', value: '123', quoted: true });
  });

  describe('enum validation', () => {
    enum Status {
      active = 'active',
      inactive = 'inactive',
      pending = 'pending',
    }

    enum Priority {
      low = 0,
      medium = 1,
      high = 2,
    }

    const enumMetadata: ColumnMetadata[] = [
      { propertyKey: 'status', operators: [FilterOperator.eq], valueType: Status },
      { propertyKey: 'priority', operators: [FilterOperator.eq], valueType: Priority },
      { propertyKey: 'color', operators: [FilterOperator.eq], valueType: ['red', 'green', 'blue'] },
    ];

    it('accepts valid string enum value', () => {
      const tree: FilterCondition = {
        field: 'status', operator: FilterOperator.eq,
        values: [{ type: 'string', value: 'active' }],
        fieldOffset: 0, operatorOffset: 6,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(0);
    });

    it('rejects invalid string enum value', () => {
      const tree: FilterCondition = {
        field: 'status', operator: FilterOperator.eq,
        values: [{ type: 'string', value: 'deleted' }],
        fieldOffset: 0, operatorOffset: 6,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('deleted');
      expect(errors[0].message).toContain('active');
    });

    it('accepts valid numeric enum value and coerces to number', () => {
      const tree: FilterCondition = {
        field: 'priority', operator: FilterOperator.eq,
        values: [{ type: 'string', value: '1' }],
        fieldOffset: 0, operatorOffset: 8,
      };
      const { tree: result, errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(0);
      expect((result as FilterCondition).values[0]).toEqual({ type: 'number', value: 1 });
    });

    it('rejects invalid numeric enum value', () => {
      const tree: FilterCondition = {
        field: 'priority', operator: FilterOperator.eq,
        values: [{ type: 'string', value: '99' }],
        fieldOffset: 0, operatorOffset: 8,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('99');
    });

    it('accepts valid string array enum value', () => {
      const tree: FilterCondition = {
        field: 'color', operator: FilterOperator.eq,
        values: [{ type: 'string', value: 'red' }],
        fieldOffset: 0, operatorOffset: 5,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(0);
    });

    it('rejects invalid string array enum value', () => {
      const tree: FilterCondition = {
        field: 'color', operator: FilterOperator.eq,
        values: [{ type: 'string', value: 'purple' }],
        fieldOffset: 0, operatorOffset: 5,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('purple');
      expect(errors[0].message).toContain('red');
    });

    it('validates multi-value enum', () => {
      const tree: FilterCondition = {
        field: 'status', operator: FilterOperator.eq,
        values: [
          { type: 'string', value: 'active' },
          { type: 'string', value: 'deleted' },
        ],
        fieldOffset: 0, operatorOffset: 6,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('deleted');
    });

    it('preserves null values with enum type', () => {
      const tree: FilterCondition = {
        field: 'status', operator: FilterOperator.eq,
        values: [{ type: 'null' }],
        fieldOffset: 0, operatorOffset: 6,
      };
      const { errors } = coerceFilterValues(tree, enumMetadata);
      expect(errors).toHaveLength(0);
    });
  });
});
