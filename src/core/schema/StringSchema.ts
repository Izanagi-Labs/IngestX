import { StringSchemaRule, StringRuleType } from '../types/RuleType';
import { CommonSchema } from './CommonSchema';

export class StringSchema extends CommonSchema<number, StringSchemaRule> {
  min(value: number, message?: string): this {
    return this.addRule({ type: StringRuleType.Min, value, message });
  }

  max(value: number, message?: string): this {
    return this.addRule({ type: StringRuleType.Max, value, message });
  }

  allowedValues(values: readonly number[], message?: string): this {
    return this.addRule({
      type: StringRuleType.AllowedValues,
      value: values,
      message,
    });
  }

  regex(pattern: RegExp, message?: string): this {
    return this.addRule({
      type: StringRuleType.Regex,
      value: pattern,
      message,
    });
  }

  caseSensitive(): this {
    return this.addRule({
      type: StringRuleType.CaseSensitive,
      value: true,
    });
  }
}
