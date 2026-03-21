import { Lexer, ILexingResult } from 'chevrotain';
import { allTokens } from './tokens';

const lexerInstance = new Lexer(allTokens);

export function tokenize(input: string): ILexingResult {
  return lexerInstance.tokenize(input);
}

export { allTokens } from './tokens';
export * from './tokens';
