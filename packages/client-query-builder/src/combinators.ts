import { Buildable, CompoundCondition } from './condition';

export function and(...conditions: Buildable[]): CompoundCondition {
  return new CompoundCondition('AND', conditions);
}

export function or(...conditions: Buildable[]): CompoundCondition {
  return new CompoundCondition('OR', conditions);
}
