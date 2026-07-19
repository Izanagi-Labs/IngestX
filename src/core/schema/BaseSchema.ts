import type { Rule } from '../types/Rule';

export abstract class BaseSchema<TRuleType> {
  protected readonly rules: Rule<TRuleType>[] = [];

  _getRules(): readonly Rule<TRuleType>[] {
    return this.rules;
  }

  protected addRule(type: TRuleType, value?: unknown, message?: string): this {
    this.rules.push({
      type,
      value,
      message,
    });

    return this;
  }
}
