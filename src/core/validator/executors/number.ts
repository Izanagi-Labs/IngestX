import { Rule } from "../../../model/schema/types/Rule";
import { RuleType, NumberRuleType } from "../../../model/schema/types/RuleType";
import { RuleExecutionState, ValidationErrorType } from "../types";
import { createError } from "../utils";

export function executeNumberRule(
  rule: Rule<RuleType>,
  state: RuleExecutionState,
): void {
  let stringifiedValue = state.value as string;
  const trim = state.trim ?? false;

  let currentValue = Number(stringifiedValue);

  if (trim) {
    stringifiedValue = stringifiedValue.trim();
    currentValue = Number(stringifiedValue);
    state.value = currentValue;
  }

  if (!Number.isFinite(currentValue)) {
    state.errors.push(
      createError(
        ValidationErrorType.InvalidType,
        "Expected value to be a valid number",
      ),
    );

    return;
  }

  state.value = currentValue;

  switch (rule.type) {
    case NumberRuleType.Min:
      if (currentValue < (rule.value as number)) {
        state.errors.push(
          createError(
            rule.type,
            rule.message || `Minimum value is ${rule.value}`,
          ),
        );
      }
      break;

    case NumberRuleType.Max:
      if (currentValue > (rule.value as number)) {
        state.errors.push(
          createError(
            rule.type,
            rule.message || `Maximum value is ${rule.value}`,
          ),
        );
      }
      break;

    case NumberRuleType.AllowedValues:
      if (Array.isArray(rule.value) && !rule.value.includes(currentValue)) {
        state.errors.push(
          createError(rule.type, rule.message || `Value not allowed`),
        );
      }
      break;
  }
}
