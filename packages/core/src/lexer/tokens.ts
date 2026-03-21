import { createToken, Lexer } from 'chevrotain';

// --- Operators (longest-first for greedy matching) ---

export const GreaterEqual = createToken({ name: 'GreaterEqual', pattern: />=/ });
export const LessEqual    = createToken({ name: 'LessEqual',    pattern: /<=/ });
export const NotEqual     = createToken({ name: 'NotEqual',     pattern: /!=/ });
export const IStartsWith  = createToken({ name: 'IStartsWith',  pattern: /\^~/ });
export const IEndsWith    = createToken({ name: 'IEndsWith',    pattern: /\$~/ });
export const IContains    = createToken({ name: 'IContains',    pattern: /\*~/ });
export const INotEqual    = createToken({ name: 'INotEqual',    pattern: /!~/ });
export const StartsWith   = createToken({ name: 'StartsWith',   pattern: /\^=/ });
export const EndsWith     = createToken({ name: 'EndsWith',     pattern: /\$=/ });
export const Contains     = createToken({ name: 'Contains',     pattern: /\*=/ });

export const GreaterThan  = createToken({ name: 'GreaterThan',  pattern: />/ });
export const LessThan     = createToken({ name: 'LessThan',     pattern: /</ });
export const IEquals      = createToken({ name: 'IEquals',      pattern: /~/ });
export const Equals       = createToken({ name: 'Equals',       pattern: /=/ });

// --- Structural tokens ---

export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });
export const Pipe      = createToken({ name: 'Pipe',      pattern: /\|/ });
export const Comma     = createToken({ name: 'Comma',     pattern: /,/ });

// --- Literals ---

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"(?:[^"\\]|\\.)*"/,
});

// --- Generic token (field names, unquoted values) ---
// Defined before NullLiteral so it can be referenced as longer_alt

export const Token = createToken({
  name: 'Token',
  pattern: /[^,"|;!=><^$*~\s]+/,
});

// --- Null keyword (must come before Token in allTokens array) ---
// longer_alt ensures "nullable" matches Token, but "null" matches NullLiteral

export const NullLiteral = createToken({
  name: 'NullLiteral',
  pattern: /null/,
  longer_alt: Token,
});

// --- Whitespace (skipped) ---

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

// --- All tokens in order (order matters for Chevrotain) ---

export const allTokens = [
  WhiteSpace,
  // Operators: two-char before single-char
  GreaterEqual, LessEqual, NotEqual,
  IStartsWith, IEndsWith, IContains, INotEqual,
  StartsWith, EndsWith, Contains,
  GreaterThan, LessThan, IEquals, Equals,
  // Structural
  Semicolon, Pipe, Comma,
  // Literals
  StringLiteral,
  NullLiteral,
  Token,
];
