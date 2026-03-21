import { CstParser } from 'chevrotain';
import {
  allTokens,
  Token,
  Semicolon,
  Pipe,
  Comma,
  StringLiteral,
  NullLiteral,
  Equals,
  NotEqual,
  GreaterThan,
  LessThan,
  GreaterEqual,
  LessEqual,
  IEquals,
  INotEqual,
  StartsWith,
  EndsWith,
  Contains,
  IStartsWith,
  IEndsWith,
  IContains,
} from '../lexer/tokens';

export class FilterParser extends CstParser {
  constructor() {
    super(allTokens);
    this.performSelfAnalysis();
  }

  public orExpression = this.RULE('orExpression', () => {
    this.SUBRULE(this.andExpression, { LABEL: 'andExpression' });
    this.MANY(() => {
      this.CONSUME(Pipe);
      this.SUBRULE2(this.andExpression, { LABEL: 'andExpression' });
    });
  });

  private andExpression = this.RULE('andExpression', () => {
    this.SUBRULE(this.condition, { LABEL: 'condition' });
    this.MANY(() => {
      this.CONSUME(Semicolon);
      this.SUBRULE2(this.condition, { LABEL: 'condition' });
    });
  });

  private condition = this.RULE('condition', () => {
    this.CONSUME(Token, { LABEL: 'field' });
    this.SUBRULE(this.operator, { LABEL: 'operator' });
    this.SUBRULE(this.values, { LABEL: 'values' });
  });

  private operator = this.RULE('operator', () => {
    this.OR([
      { ALT: () => this.CONSUME(GreaterEqual) },
      { ALT: () => this.CONSUME(LessEqual) },
      { ALT: () => this.CONSUME(NotEqual) },
      { ALT: () => this.CONSUME(IStartsWith) },
      { ALT: () => this.CONSUME(IEndsWith) },
      { ALT: () => this.CONSUME(IContains) },
      { ALT: () => this.CONSUME(INotEqual) },
      { ALT: () => this.CONSUME(StartsWith) },
      { ALT: () => this.CONSUME(EndsWith) },
      { ALT: () => this.CONSUME(Contains) },
      { ALT: () => this.CONSUME(GreaterThan) },
      { ALT: () => this.CONSUME(LessThan) },
      { ALT: () => this.CONSUME(IEquals) },
      { ALT: () => this.CONSUME(Equals) },
    ]);
  });

  private values = this.RULE('values', () => {
    this.SUBRULE(this.value, { LABEL: 'value' });
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.value, { LABEL: 'value' });
    });
  });

  private value = this.RULE('value', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NullLiteral) },
      { ALT: () => this.CONSUME(Token) },
    ]);
  });
}
