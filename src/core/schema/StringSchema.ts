import { StringSchemaRule, StringRuleType } from '../types/RuleType';
import { CommonSchema } from './CommonSchema';

export class StringSchema extends CommonSchema<number, StringSchemaRule> {
  min(value: number, message?: string): this {
    return this.addRule(StringRuleType.Min, value, message);
  }

  max(value: number, message?: string): this {
    return this.addRule(StringRuleType.Max, value, message);
  }

  allowedValues(values: readonly number[], message?: string): this {
    return this.addRule(StringRuleType.AllowedValues, values, message);
  }

  regex(pattern: RegExp, message?: string): this {
    return this.addRule(StringRuleType.Regex, pattern, message);
  }

  caseSensitive(): this {
    return this.addRule(StringRuleType.caseSensitive, true);
  }
}
