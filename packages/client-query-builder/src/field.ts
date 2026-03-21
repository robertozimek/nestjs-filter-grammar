import { Condition } from './condition';
import { methodNameForSymbol } from './serialize';

const MULTI_VALUE_METHODS = new Set(['eq', 'neq', 'iEq', 'iNeq']);

type ScalarValue = string | number | boolean | null;

type FieldMethods<T extends ScalarValue> = Record<
  string,
  (...values: (T | null)[]) => Condition
>;

export function field<T extends ScalarValue>(
  name: string,
  operatorSymbols: string[],
): FieldMethods<T> {
  const methods: FieldMethods<T> = {} as FieldMethods<T>;

  for (const symbol of operatorSymbols) {
    const methodName = methodNameForSymbol(symbol);
    if (!methodName) continue;

    if (MULTI_VALUE_METHODS.has(methodName)) {
      methods[methodName] = (...values: (T | null)[]) =>
        new Condition(name, symbol, values as ScalarValue[]);
    } else {
      methods[methodName] = ((value: T) =>
        new Condition(name, symbol, [value as ScalarValue])) as FieldMethods<T>[string];
    }
  }

  return methods;
}
