import { Rule } from '../../../model/schema/types/Rule';
import { RuleType, BooleanRuleType } from '../../../model/schema/types/RuleType';
import { RuleExecutionState, ValidationContext } from '../types';
import { createError } from '../utils';

export function executeBooleanRule(
  rule: Rule<RuleType>,
  state: RuleExecutionState,
  _context: ValidationContext,
): void {
  const currentValue = state.value;

  switch (rule.type) {
    case BooleanRuleType.Truthy:
      if (Array.isArray(rule.value) && typeof currentValue === 'string') {
        if (!rule.value.includes(currentValue.toLowerCase())) {
          state.errors.push(createError(rule.type, rule.message || `Value is not truthy`));
        }
      }
      break;

    case BooleanRuleType.Falsy:
      if (Array.isArray(rule.value) && typeof currentValue === 'string') {
        if (!rule.value.includes(currentValue.toLowerCase())) {
          state.errors.push(createError(rule.type, rule.message || `Value is not falsy`));
        }
      }
      break;

    case BooleanRuleType.CaseSensitive:
      // Typically handled elsewhere, but placeholder for structure
      break;
  }
}
