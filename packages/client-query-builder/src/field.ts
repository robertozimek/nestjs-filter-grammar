import { Condition } from './condition';
import { methodNameForSymbol } from './serialize';

const MULTI_VALUE_METHODS = new Set(['eq', 'neq', 'iEq', 'iNeq']);

export function field<T>(name: string, operatorSymbols: string[]): Record<string, Function> {
  const methods: Record<string, Function> = {};

  for (const symbol of operatorSymbols) {
    const methodName = methodNameForSymbol(symbol);
    if (!methodName) continue;

    if (MULTI_VALUE_METHODS.has(methodName)) {
      methods[methodName] = (...values: (T | null)[]) =>
        new Condition(name, symbol, values as (string | number | boolean | null)[]);
    } else {
      methods[methodName] = (value: T) =>
        new Condition(name, symbol, [value as string | number | boolean | null]);
    }
  }

  return methods;
}
