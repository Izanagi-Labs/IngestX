export enum StringRuleType {
  Min = 'string:min',
  Max = 'string:max',
  Regex = 'string:regex',
  AllowedValues = 'string:allowed-values',
}

export enum NumberRuleType {
  Min = 'number:min',
  Max = 'number:max',
  AllowedValues = 'number:allowed-values',
}

export enum BooleanRuleType {
  Truthy = 'boolean:truthy',
  Falsy = 'boolean:falsy',
}

export enum CommonRuleType {
  Optional = 'optional',
  Default = 'default',
  Custom = 'custom',
  Transform = 'transform',
}

export type StringSchemaRule = CommonRuleType | StringRuleType;

export type NumberSchemaRule = CommonRuleType | NumberRuleType;

export type BooleanSchemaRule = CommonRuleType | BooleanRuleType;
