import { Rule } from '../../../model/schema/types/Rule';
import { CommonRuleType, RuleType } from '../../../model/schema/types/RuleType';
import { RuleExecutionState, ValidationContext } from '../types';
import { createError, isEmpty } from '../utils';

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
      if (typeof rule.value === 'function') {
        state.value = rule.value(state.value, context.row);
      }
      break;

    case CommonRuleType.Custom:
      if (typeof rule.value === 'function') {
        const [isValid, customMessage] = rule.value(state.value, context.row);
        if (!isValid) {
          state.errors.push(
            createError(
              rule.type,
              customMessage || rule.message || 'Custom validation failed',
            ),
          );
        }
      }
      break;
  }

  // Handle required check if the value is empty
  // We do this inside executeRules or common executor?
  // Wait, if it's empty, and we process all rules sequentially, where does the 'Required' check belong?
  // We can do it here for Optional type, but 'Optional' rule just marks it as optional.
  // Actually, checking empty state should probably be handled by the orchestrator so it can short-circuit cleanly, OR we can handle it in the orchestrator before delegating to type-specific rules.
  // The user prompt said: common.ts is responsible for: Optional, Default, Transform, Custom, Required/empty value handling.
}

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
        createError(CommonRuleType.Optional as any, 'Value is required'),
      );
      state.stop = true;
    }
  }
}
