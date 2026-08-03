import { RuleType } from '../../model/schema/types/RuleType';
import { ValidationError } from '../../model/schema/types/ValidationResult';

export function createError(rule: RuleType, message: string): ValidationError<RuleType> {
  return { rule, message };
}

export function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function applyTransform(value: unknown, transformFn?: (v: unknown) => unknown): unknown {
  if (typeof transformFn === 'function') {
    return transformFn(value);
  }
  return value;
}
