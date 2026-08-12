import { BaseSchema } from './BaseSchema';
import { CommonRuleType } from './types';

export abstract class CommonSchema<TValue, TRuleType> extends BaseSchema<
  TRuleType | CommonRuleType
> {
  custom(validator: (value: TValue) => boolean, message?: string): this {
    return this.addRule({
      type: CommonRuleType.Custom,
      value: validator,
      message,
    });
  }

  optional(): this {
    return this.addRule({
      type: CommonRuleType.Optional,
      value: true,
    });
  }

  default(value: TValue): this {
    return this.addRule({
      type: CommonRuleType.Default,
      value,
    });
  }

  transform(transform: (value: TValue) => TValue): this {
    return this.addRule({
      type: CommonRuleType.Transform,
      value: transform,
    });
  }

  trim(): this {
    return this.addRule({
      type: CommonRuleType.Trim,
      value: true,
    });
  }
}
