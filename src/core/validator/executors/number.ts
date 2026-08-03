import { Rule } from '../../../model/schema/types/Rule';
import { RuleType, NumberRuleType } from '../../../model/schema/types/RuleType';
import { RuleExecutionState, ValidationContext } from '../types';
import { createError } from '../utils';

export function executeNumberRule(
  rule: Rule<RuleType>,
  state: RuleExecutionState,
  _context: ValidationContext,
): void {
  const currentValue = state.value;

  if (typeof currentValue !== 'number') {
    return;
  }

  switch (rule.type) {
    case NumberRuleType.Min:
      if (currentValue < (rule.value as number)) {
        state.errors.push(createError(rule.type, rule.message || `Minimum value is ${rule.value}`));
      }
      break;

    case NumberRuleType.Max:
      if (currentValue > (rule.value as number)) {
        state.errors.push(createError(rule.type, rule.message || `Maximum value is ${rule.value}`));
      }
      break;

    case NumberRuleType.AllowedValues:
      if (Array.isArray(rule.value) && !rule.value.includes(currentValue)) {
        state.errors.push(createError(rule.type, rule.message || `Value not allowed`));
      }
      break;
  }
}
