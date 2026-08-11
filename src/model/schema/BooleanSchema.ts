import { BooleanRuleType } from './types';
import { CommonSchema } from './CommonSchema';

export class BooleanSchema extends CommonSchema<boolean, BooleanRuleType> {
  truthy(values: string[], message?: string): this {
    return this.addRule({
      type: BooleanRuleType.Truthy,
      value: values,
      message,
    });
  }

  falsy(values: string[], message?: string): this {
    return this.addRule({
      type: BooleanRuleType.Falsy,
      value: values,
      message,
    });
  }

  caseSensitive(value: boolean): this {
    return this.addRule({
      type: BooleanRuleType.CaseSensitive,
      value,
    });
  }
}
