import { BaseSchema } from './BaseSchema';
import { CommonRuleType } from '../types/RuleType';

export abstract class CommonSchema<
  TValue,
  TRuleType extends CommonRuleType | string,
> extends BaseSchema<TRuleType | CommonRuleType> {
  refine(validator: (value: TValue) => boolean, message?: string): this {
    return this.addRule(CommonRuleType.Refine, validator, message);
  }

  optional(): this {
    return this.addRule(CommonRuleType.Optional, true);
  }

  default(value: TValue): this {
    return this.addRule(CommonRuleType.Default, value);
  }

  transform(transform: (value: TValue) => TValue): this {
    return this.addRule(CommonRuleType.Transform, transform);
  }
}
