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
  const isCaseSensitive = state.caseSensitive ?? false;

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
      if (Array.isArray(rule.value)) {
        const matches = rule.value.some((allowedValue) => {
          if (isCaseSensitive) {
            return allowedValue === currentValue;
          }
          return (
            typeof allowedValue === 'string' &&
            allowedValue.toLowerCase() === currentValue.toLowerCase()
          );
        });

        if (!matches) {
          state.errors.push(
            createError(rule.type, rule.message || `Value not allowed`),
          );
        }
      }
      break;
  }
}
