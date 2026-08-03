import { BooleanRuleType } from './types';
import { CommonSchema } from './CommonSchema';

// true and false (even upper or any case) are valid values in all cases

// The validation will be like if none of them is provided
// then only "true" and "false" will be considered, any value other than that
// will fail the validation (marked as invalid)

// if one of them is provided (truthy or falsy) then any value which is not part of the array
// will fail validation, meaning it will be a invalid row

// if both are provided then any value which is not part of both array
// will fail validation, meaning it will be a invalid row
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

  caseSensitive(value: boolean = false): this {
    return this.addRule({
      type: BooleanRuleType.CaseSensitive,
      value,
    });
  }
}
