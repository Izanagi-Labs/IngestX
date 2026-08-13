import { Rule } from "../../../model/schema/types/Rule";
import {
  RuleType,
  BooleanRuleType,
} from "../../../model/schema/types/RuleType";
import { RuleExecutionState } from "../types";
import { createError } from "../utils";

export function executeBooleanRule(
  rules: readonly Rule<RuleType>[],
  state: RuleExecutionState,
): void {
  if (typeof state.value !== "string") {
    return;
  }

  let currentValue = state.value as string;
  const isCaseSensitive = state.caseSensitive ?? false;
  const trim = state.trim ?? false;

  if (trim) {
    currentValue = currentValue.trim();
    state.value = currentValue;
  }

  const normalize = (value: string) =>
    isCaseSensitive ? value : value.toLowerCase();

  const truthyRule = rules.find((r) => r.type === BooleanRuleType.Truthy);
  const falsyRule = rules.find((r) => r.type === BooleanRuleType.Falsy);

  const allowed = new Set<string>();

  if (truthyRule && Array.isArray(truthyRule.value)) {
    truthyRule.value.forEach((v) => allowed.add(normalize(v)));
  } else {
    allowed.add(normalize("true"));
  }

  if (falsyRule && Array.isArray(falsyRule.value)) {
    falsyRule.value.forEach((v) => allowed.add(normalize(v)));
  } else {
    allowed.add(normalize("false"));
  }

  if (!allowed.has(normalize(currentValue))) {
    state.errors.push(
      createError(
        BooleanRuleType.Truthy,
        "Expected value to be a valid boolean",
      ),
    );
  }
}
