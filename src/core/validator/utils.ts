import { RuleType } from '../../model/schema/types/RuleType';
import { ValidationError } from '../../model/schema/types/ValidationResult';
import { ValidationErrorType } from './types';

export function createError(
  rule: RuleType | ValidationErrorType,
  message: string,
): ValidationError<RuleType | ValidationErrorType> {
  return { rule, message };
}

export function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === '';
}

export function applyTransform(
  value: unknown,
  transformFn?: (v: unknown) => unknown,
): unknown {
  if (typeof transformFn === 'function') {
    return transformFn(value);
  }
  return value;
}
