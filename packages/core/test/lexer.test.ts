import { describe, it, expect } from 'vitest';
import { tokenize } from '../src/lexer';

describe('Lexer', () => {
  describe('operators', () => {
    it('tokenizes two-character operators', () => {
      const result = tokenize('field>=value');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'GreaterEqual', 'Token']);
    });

    it('tokenizes single-character operators', () => {
      const result = tokenize('field>value');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'GreaterThan', 'Token']);
    });

    it('tokenizes all two-char operators correctly', () => {
      const ops = ['>=', '<=', '!=', '^~', '$~', '*~', '!~', '^=', '$=', '*='];
      for (const op of ops) {
        const result = tokenize(`field${op}value`);
        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
      }
    });

    it('tokenizes all single-char operators correctly', () => {
      const ops = ['>', '<', '~', '='];
      for (const op of ops) {
        const result = tokenize(`field${op}value`);
        expect(result.errors).toHaveLength(0);
        expect(result.tokens).toHaveLength(3);
      }
    });
  });

  describe('structural tokens', () => {
    it('tokenizes semicolon as AND separator', () => {
      const result = tokenize('a=1;b=2');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'Token', 'Semicolon', 'Token', 'Equals', 'Token']);
    });

    it('tokenizes pipe as OR separator', () => {
      const result = tokenize('a=1|b=2');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'Token', 'Pipe', 'Token', 'Equals', 'Token']);
    });

    it('tokenizes comma as value separator', () => {
      const result = tokenize('status=active,pending');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'Token', 'Comma', 'Token']);
    });
  });

  describe('string literals', () => {
    it('tokenizes double-quoted strings', () => {
      const result = tokenize('field="hello world"');
      expect(result.errors).toHaveLength(0);
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'StringLiteral']);
      expect(result.tokens[2].image).toBe('"hello world"');
    });

    it('tokenizes escaped quotes inside strings', () => {
      const result = tokenize('field="say \\"hi\\""');
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[2].tokenType.name).toBe('StringLiteral');
    });

    it('tokenizes escaped backslashes inside strings', () => {
      const result = tokenize('field="path\\\\dir"');
      expect(result.errors).toHaveLength(0);
      expect(result.tokens[2].tokenType.name).toBe('StringLiteral');
    });

    it('reports error for unterminated strings', () => {
      const result = tokenize('field="unterminated');
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('null keyword', () => {
    it('tokenizes null as NullLiteral', () => {
      const result = tokenize('status=null');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'NullLiteral']);
    });

    it('does not match null as part of a longer token', () => {
      const result = tokenize('status=nullable');
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'Token']);
      expect(result.tokens[2].image).toBe('nullable');
    });
  });

  describe('whitespace', () => {
    it('ignores inline whitespace', () => {
      const result = tokenize('status = active');
      expect(result.errors).toHaveLength(0);
      const types = result.tokens.map((t) => t.tokenType.name);
      expect(types).toEqual(['Token', 'Equals', 'Token']);
    });
  });

  describe('token positions', () => {
    it('tracks correct offsets', () => {
      const result = tokenize('status=active');
      expect(result.tokens[0].startOffset).toBe(0);
      expect(result.tokens[1].startOffset).toBe(6);
      expect(result.tokens[2].startOffset).toBe(7);
    });
  });
});
