import { Rule } from "../../../model/schema/types/Rule";
import { CommonRuleType, RuleType } from "../../../model/schema/types/RuleType";
import {
  RuleExecutionState,
  ValidationContext,
  ValidationErrorType,
} from "../types";
import { createError, isEmpty } from "../utils";

export function handleEmptyValue({
  state,
  isOptional,
}: {
  state: RuleExecutionState;
  isOptional: boolean;
}): void {
  if (isEmpty(state.value)) {
    if (isOptional) {
      state.stop = true;
    } else {
      state.errors.push(
        createError(ValidationErrorType.Required, "Value is required"),
      );
      state.stop = true;
    }
  }
}

export function executeCommonRule(
  rule: Rule<RuleType>,
  state: RuleExecutionState,
  context: ValidationContext,
): void {
  switch (rule.type) {
    case CommonRuleType.Default:
      if (isEmpty(state.value)) {
        state.value = rule.value;
      }
      break;

    case CommonRuleType.Transform:
      if (typeof rule.value === "function") {
        state.value = rule.value(state.value, context.row);
      }
      break;

    case CommonRuleType.Optional:
      handleEmptyValue({ state, isOptional: true });
      break;

    case CommonRuleType.Custom:
      if (typeof rule.value === "function") {
        const [isValid, customMessage] = rule.value(state.value, context.row);
        if (!isValid) {
          state.errors.push(
            createError(
              rule.type,
              customMessage || rule.message || "Custom validation failed",
            ),
          );
        }
      }
      break;
  }
}
