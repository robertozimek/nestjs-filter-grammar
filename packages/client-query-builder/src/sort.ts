import { Buildable } from './condition';

export class SortExpression implements Buildable {
  constructor(
    private readonly fieldName: string,
    private readonly direction: '+' | '-',
  ) {}

  build(): string {
    return `${this.direction}${this.fieldName}`;
  }
}

export function sortField(name: string): { asc(): SortExpression; desc(): SortExpression } {
  return {
    asc: () => new SortExpression(name, '+'),
    desc: () => new SortExpression(name, '-'),
  };
}

export function sort(...expressions: SortExpression[]): Buildable {
  return {
    build: () => expressions.map((e) => e.build()).join(','),
  };
}
