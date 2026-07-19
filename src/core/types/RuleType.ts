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
  Refine = 'refine',
  Transform = 'transform',
}

export type StringRules = CommonRuleType | StringRuleType;

export type NumberRules = CommonRuleType | NumberRuleType;

export type BooleanRules = CommonRuleType | BooleanRuleType;
