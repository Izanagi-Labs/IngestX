import { NumberRules, NumberRuleType } from '../types/RuleType';
import { CommonSchema } from './CommonSchema';

export class NumberSchema extends CommonSchema<number, NumberRules> {
  min(value: number, message?: string): this {
    return this.addRule(NumberRuleType.Min, value, message);
  }

  max(value: number, message?: string): this {
    return this.addRule(NumberRuleType.Max, value, message);
  }
}
