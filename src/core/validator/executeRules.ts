import { Rule } from '../../model/schema/types/Rule';
import {
  RuleType,
  CommonRuleType,
  StringRuleType,
  NumberRuleType,
  BooleanRuleType,
} from '../../model/schema/types/RuleType';
import {
  FieldValidationResult,
  RuleExecutionState,
  ValidationContext,
} from './types';
import { executeCommonRule, handleEmptyValue } from './executors/common';
import { executeStringRule } from './executors/string';
import { executeNumberRule } from './executors/number';
import { executeBooleanRule } from './executors/boolean';

export function executeRules(
  value: unknown,
  rules: readonly Rule<RuleType>[],
  context: ValidationContext,
): FieldValidationResult {
  const state: RuleExecutionState = {
    value,
    errors: [],
    stop: false,
  };

  const isOptional = rules.some((r) => r.type === CommonRuleType.Optional);
  let emptyChecked = false;

  for (const rule of rules) {
    if (state.stop) {
      break;
    }

    // Before executing any type-specific or custom rules, verify empty state
    if (
      !emptyChecked &&
      rule.type !== CommonRuleType.Optional &&
      rule.type !== CommonRuleType.Default &&
      rule.type !== CommonRuleType.Transform
    ) {
      handleEmptyValue({ state, isOptional });
      emptyChecked = true;

      if (state.stop) {
        break;
      }
    }

    switch (rule.type) {
      case CommonRuleType.Optional:
      case CommonRuleType.Default:
      case CommonRuleType.Transform:
      case CommonRuleType.Custom:
        executeCommonRule(rule, state, context);
        break;

      case StringRuleType.Min:
      case StringRuleType.Max:
      case StringRuleType.Regex:
      case StringRuleType.AllowedValues:
      case StringRuleType.CaseSensitive:
        executeStringRule(rule, state, context);
        break;

      case NumberRuleType.Min:
      case NumberRuleType.Max:
      case NumberRuleType.AllowedValues:
        executeNumberRule(rule, state, context);
        break;

      case BooleanRuleType.Truthy:
      case BooleanRuleType.Falsy:
      case BooleanRuleType.CaseSensitive:
        executeBooleanRule(rule, state, context);
        break;
    }
  }

  // If there were only CommonRules (e.g. no type-specific rules) and we haven't checked empty yet
  if (!emptyChecked) {
    handleEmptyValue({ state, isOptional });
  }

  return {
    valid: state.errors.length === 0,
    value: state.value,
    errors: state.errors,
  };
}
