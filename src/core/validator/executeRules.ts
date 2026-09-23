import { Rule } from "../../model/schema/types/Rule";
import {
  RuleType,
  CommonRuleType,
  StringRuleType,
  NumberRuleType,
  BooleanRuleType,
} from "../../model/schema/types/RuleType";
import {
  FieldValidationResult,
  RuleExecutionState,
  ValidationContext,
} from "./types";
import { executeCommonRule } from "./executors/common";
import { executeStringRule } from "./executors/string";
import { executeNumberRule } from "./executors/number";
import { executeBooleanRule } from "./executors/boolean";

export function executeRules(
  value: unknown,
  rules: readonly Rule<RuleType>[],
  context: ValidationContext,
): FieldValidationResult {
  const state: RuleExecutionState = {
    value,
    errors: [],
    stop: false,
    caseSensitive: false,
  };

  for (const rule of rules) {
    if (
      rule.type === StringRuleType.CaseSensitive ||
      rule.type === BooleanRuleType.CaseSensitive
    ) {
      state.caseSensitive = rule.value as boolean;
    }
  }

  // ------------------------------------
  // Phase 1 - Default
  // ------------------------------------

  for (const rule of rules) {
    if (rule.type !== CommonRuleType.Default) {
      continue;
    }

    executeCommonRule(rule, state, context);

    if (state.stop) {
      break;
    }
  }

  // ------------------------------------
  // Phase 2 - Transform
  // ------------------------------------

  if (!state.stop) {
    for (const rule of rules) {
      if (rule.type !== CommonRuleType.Transform) {
        continue;
      }

      executeCommonRule(rule, state, context);

      if (state.stop) {
        break;
      }
    }
  }

  // ------------------------------------
  // Phase 3 - Optional
  // ------------------------------------

  if (!state.stop) {
    for (const rule of rules) {
      if (rule.type !== CommonRuleType.Optional) {
        continue;
      }

      executeCommonRule(rule, state, context);

      if (state.stop) {
        break;
      }
    }
  }

  // ------------------------------------
  // Phase 4 - Type Rules
  // ------------------------------------

  if (!state.stop) {
    for (const rule of rules) {
      switch (rule.type) {
        // String
        case StringRuleType.Min:
        case StringRuleType.Max:
        case StringRuleType.Regex:
        case StringRuleType.AllowedValues:
          executeStringRule(rule, state);
          break;

        // Number
        case NumberRuleType.Min:
        case NumberRuleType.Max:
        case NumberRuleType.AllowedValues:
          executeNumberRule(rule, state);
          break;
      }

      if (state.stop) {
        break;
      }
    }

    // Boolean
    if (
      rules.some(
        (rule) =>
          rule.type === BooleanRuleType.Truthy ||
          rule.type === BooleanRuleType.Falsy,
      )
    ) {
      executeBooleanRule(rules, state);
    }
  }

  // ------------------------------------
  // Phase 5 - Custom
  // ------------------------------------

  if (!state.stop) {
    for (const rule of rules) {
      if (rule.type !== CommonRuleType.Custom) {
        continue;
      }

      executeCommonRule(rule, state, context);

      if (state.stop) {
        break;
      }
    }
  }

  return {
    valid: state.errors.length === 0,
    value: state.value,
    errors: state.errors,
  };
}
