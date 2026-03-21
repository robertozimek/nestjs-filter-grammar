import { tokenize } from './lexer';
import { FilterParser } from './parser/filter-parser';
import { buildFilterVisitor } from './visitor/filter-visitor';
import { FilterParseException } from './errors/filter-parse-exception';
import { FilterTree, FilterError } from './types';

// Singleton parser/visitor — Chevrotain parsers are stateful (parser.input = ...),
// but Node.js is single-threaded so concurrent access is not a concern in practice.
const parser = new FilterParser();
const visitor = buildFilterVisitor(parser);

export function parseFilter(input: string): FilterTree {
  // Step 1: Tokenize
  const lexResult = tokenize(input);

  if (lexResult.errors.length > 0) {
    const errors: FilterError[] = lexResult.errors.map((e) => ({
      message: e.message,
      offset: e.offset,
      length: e.length,
    }));
    throw new FilterParseException(errors);
  }

  // Step 2: Parse
  parser.input = lexResult.tokens;
  const cst = parser.orExpression();

  if (parser.errors.length > 0) {
    const errors: FilterError[] = parser.errors.map((e) => ({
      message: e.message,
      offset: e.token.startOffset,
      length: e.token.image.length,
    }));
    throw new FilterParseException(errors);
  }

  // Step 3: Visit CST → FilterTree
  return visitor.visit(cst);
}
