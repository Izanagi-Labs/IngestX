import { StringSchemaRule, StringRuleType } from "./types";
import { CommonSchema } from "./CommonSchema";

export class StringSchema extends CommonSchema<string, StringSchemaRule> {
  min(value: number, message?: string): this {
    return this.addRule({ type: StringRuleType.Min, value, message });
  }

  max(value: number, message?: string): this {
    return this.addRule({ type: StringRuleType.Max, value, message });
  }

  allowedValues(values: readonly string[], message?: string): this {
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

  caseSensitive(value: boolean): this {
    return this.addRule({
      type: StringRuleType.CaseSensitive,
      value,
    });
  }
}
