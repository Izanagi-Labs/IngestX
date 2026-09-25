import type { Rule } from "./types";

export abstract class BaseSchema<TRuleType> {
  protected readonly rules: Rule<TRuleType>[] = [];

  /**
   * @internal
   */
  _getRules(): readonly Rule<TRuleType>[] {
    return this.rules;
  }

  protected addRule(rule: Rule<TRuleType>): this {
    this.rules.push(rule);
    return this;
  }
}
