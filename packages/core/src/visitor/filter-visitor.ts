import { CstNode } from 'chevrotain';
import { FilterParser } from '../parser/filter-parser';
import {
  FilterTree,
  FilterCondition,
  FilterValue,
  FilterOperator,
} from '../types';

const OPERATOR_MAP: Record<string, FilterOperator> = {
  Equals: FilterOperator.eq,
  NotEqual: FilterOperator.neq,
  GreaterThan: FilterOperator.gt,
  LessThan: FilterOperator.lt,
  GreaterEqual: FilterOperator.gte,
  LessEqual: FilterOperator.lte,
  IEquals: FilterOperator.iEq,
  INotEqual: FilterOperator.iNeq,
  StartsWith: FilterOperator.startsWith,
  EndsWith: FilterOperator.endsWith,
  Contains: FilterOperator.contains,
  IStartsWith: FilterOperator.iStartsWith,
  IEndsWith: FilterOperator.iEndsWith,
  IContains: FilterOperator.iContains,
};

function unescapeString(raw: string): string {
  // Strip surrounding quotes
  const inner = raw.slice(1, -1);
  // Backslash unescaping must happen before quote unescaping
  return inner.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
}

function simplify(type: 'AND' | 'OR', conditions: FilterTree[]): FilterTree {
  if (conditions.length === 1) {
    return conditions[0];
  }
  return { type, conditions };
}

export function buildFilterVisitor(parser: FilterParser) {
  const BaseVisitor = parser.getBaseCstVisitorConstructor();

  class FilterCstVisitor extends BaseVisitor {
    constructor() {
      super();
      this.validateVisitor();
    }

    orExpression(ctx: any): FilterTree {
      const andNodes: FilterTree[] = ctx.andExpression.map((node: CstNode) =>
        this.visit(node),
      );
      return simplify('OR', andNodes);
    }

    andExpression(ctx: any): FilterTree {
      const conditions: FilterTree[] = ctx.condition.map((node: CstNode) =>
        this.visit(node),
      );
      return simplify('AND', conditions);
    }

    condition(ctx: any): FilterCondition {
      const fieldToken = ctx.field[0];
      const field: string = fieldToken.image;
      const fieldOffset: number = fieldToken.startOffset;
      const { operator, operatorOffset } = this.visit(ctx.operator);
      const values: FilterValue[] = this.visit(ctx.values);

      return { field, operator, values, fieldOffset, operatorOffset };
    }

    operator(ctx: any): { operator: FilterOperator; operatorOffset: number } {
      for (const [tokenName, op] of Object.entries(OPERATOR_MAP)) {
        if (ctx[tokenName]) {
          return { operator: op, operatorOffset: ctx[tokenName][0].startOffset };
        }
      }
      throw new Error('Unexpected operator in CST');
    }

    values(ctx: any): FilterValue[] {
      return ctx.value.map((node: CstNode) => this.visit(node));
    }

    value(ctx: any): FilterValue {
      if (ctx.NullLiteral) {
        return { type: 'null' };
      }
      if (ctx.StringLiteral) {
        const raw: string = ctx.StringLiteral[0].image;
        return { type: 'string', value: unescapeString(raw) };
      }
      // Token (generic unquoted value)
      return { type: 'string', value: ctx.Token[0].image };
    }
  }

  return new FilterCstVisitor();
}
