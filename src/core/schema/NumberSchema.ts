import { NumberSchemaRule, NumberRuleType } from '../types/RuleType';
import { CommonSchema } from './CommonSchema';

export class NumberSchema extends CommonSchema<number, NumberSchemaRule> {
  min(value: number, message?: string): this {
    return this.addRule(NumberRuleType.Min, value, message);
  }

  max(value: number, message?: string): this {
    return this.addRule(NumberRuleType.Max, value, message);
  }

  allowedValues(values: readonly number[], message?: string): this {
    return this.addRule(NumberRuleType.AllowedValues, values, message);
  }
}
