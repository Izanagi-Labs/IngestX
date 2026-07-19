import { BaseSchema } from "./BaseSchema";
import { RuleType } from "../types/RuleType";

export class NumberSchema extends BaseSchema {
    // Maybe we can restrict the rule type based on the schema type
    // readonly type = SchemaType.Number; 

  min(value: number, message?: string): this {
    return this.addRule(
      RuleType.NumberMin,
      value,
      message
    );
  }

  max(value: number, message?: string): this {
    return this.addRule(
      RuleType.NumberMax,
      value,
      message
    );
  }

  required(message?: string): this {
    return this.addRule(
      RuleType.Required,
      true,
      message
    );
  }

  optional(): this {
    return this.addRule(
      RuleType.Optional,
      true
    );
  }

  default(value: number): this {
    return this.addRule(
      RuleType.Default,
      value
    );
  }
}