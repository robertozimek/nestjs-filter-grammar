import { serializeValue } from './serialize';

export interface Buildable {
  build(): string;
  readonly compoundType?: 'AND' | 'OR';
}

export class Condition implements Buildable {
  constructor(
    private readonly fieldName: string,
    private readonly operator: string,
    private readonly values: (string | number | boolean | null)[],
  ) {}

  build(): string {
    const serializedValues = this.values.map(serializeValue).join(',');
    return `${this.fieldName}${this.operator}${serializedValues}`;
  }
}

export class CompoundCondition implements Buildable {
  readonly compoundType: 'AND' | 'OR';

  constructor(
    type: 'AND' | 'OR',
    private readonly children: Buildable[],
  ) {
    this.compoundType = type;
  }

  build(): string {
    if (this.children.length === 1) {
      return this.children[0].build();
    }

    const separator = this.compoundType === 'AND' ? ';' : '|';

    return this.children
      .map((child) => {
        const built = child.build();
        if (child.compoundType && child.compoundType !== this.compoundType) {
          return `(${built})`;
        }
        return built;
      })
      .join(separator);
  }
}
