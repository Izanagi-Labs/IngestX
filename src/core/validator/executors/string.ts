import { Rule } from '../../../model/schema/types/Rule';
import { RuleType, StringRuleType } from '../../../model/schema/types/RuleType';
import { RuleExecutionState, ValidationContext } from '../types';
import { createError } from '../utils';

export function executeStringRule(
  rule: Rule<RuleType>,
  state: RuleExecutionState,
  _context: ValidationContext,
): void {
  const currentValue = state.value as string;

  switch (rule.type) {
    case StringRuleType.Min:
      if (currentValue.length < (rule.value as number)) {
        state.errors.push(
          createError(
            rule.type,
            rule.message || `Minimum length is ${rule.value}`,
          ),
        );
      }
      break;

    case StringRuleType.Max:
      if (currentValue.length > (rule.value as number)) {
        state.errors.push(
          createError(
            rule.type,
            rule.message || `Maximum length is ${rule.value}`,
          ),
        );
      }
      break;

    case StringRuleType.Regex:
      if (rule.value instanceof RegExp && !rule.value.test(currentValue)) {
        state.errors.push(
          createError(
            rule.type,
            rule.message || `Value does not match the required pattern`,
          ),
        );
      }
      break;

    case StringRuleType.AllowedValues:
      if (Array.isArray(rule.value) && !rule.value.includes(currentValue)) {
        state.errors.push(
          createError(rule.type, rule.message || `Value not allowed`),
        );
      }
      break;

    case StringRuleType.CaseSensitive:
      // Handled in conjunction with other operations usually, or just skipped if not a direct validation.
      break;
  }
}
