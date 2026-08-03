import { Rule } from '../../../model/schema/types/Rule';
import {
  RuleType,
  BooleanRuleType,
} from '../../../model/schema/types/RuleType';
import { RuleExecutionState, ValidationContext } from '../types';
import { createError } from '../utils';

export function executeBooleanRule(
  rule: Rule<RuleType>,
  state: RuleExecutionState,
  _context: ValidationContext,
): void {
  const currentValue = state.value;
  const isCaseSensitive = state.caseSensitive ?? false;

  switch (rule.type) {
    case BooleanRuleType.Truthy:
      if (Array.isArray(rule.value) && typeof currentValue === 'string') {
        const matches = rule.value.some((val) =>
          isCaseSensitive
            ? val === currentValue
            : val.toLowerCase() === currentValue.toLowerCase(),
        );
        if (!matches) {
          state.errors.push(
            createError(rule.type, rule.message || `Value is not truthy`),
          );
        }
      }
      break;

    case BooleanRuleType.Falsy:
      if (Array.isArray(rule.value) && typeof currentValue === 'string') {
        const matches = rule.value.some((val) =>
          isCaseSensitive
            ? val === currentValue
            : val.toLowerCase() === currentValue.toLowerCase(),
        );
        if (!matches) {
          state.errors.push(
            createError(rule.type, rule.message || `Value is not falsy`),
          );
        }
      }
      break;
  }
}
