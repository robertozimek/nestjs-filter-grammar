const NEEDS_QUOTING = /[,"|;!=><^$*~()\\\s]/;

export function serializeValue(value: string | number | boolean | null): string {
  if (value === null) return 'null';
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);

  if (NEEDS_QUOTING.test(value)) {
    const escaped = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
  }
  return value;
}

const OPERATOR_SYMBOLS: Record<string, string> = {
  eq: '=',
  neq: '!=',
  gt: '>',
  lt: '<',
  gte: '>=',
  lte: '<=',
  iEq: '~',
  iNeq: '!~',
  startsWith: '^=',
  endsWith: '$=',
  contains: '*=',
  iStartsWith: '^~',
  iEndsWith: '$~',
  iContains: '*~',
};

export function operatorSymbol(methodName: string): string {
  return OPERATOR_SYMBOLS[methodName];
}

const SYMBOL_TO_METHOD: Record<string, string> = {};
for (const [method, symbol] of Object.entries(OPERATOR_SYMBOLS)) {
  SYMBOL_TO_METHOD[symbol] = method;
}

export function methodNameForSymbol(symbol: string): string {
  return SYMBOL_TO_METHOD[symbol];
}
