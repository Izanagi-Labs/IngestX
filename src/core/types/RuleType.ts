export enum StringRuleType {
  Min = 'string:min',
  Max = 'string:max',
  Regex = 'string:regex',
}

export enum NumberRuleType {
  Min = 'number:min',
  Max = 'number:max',
}

export enum BooleanRuleType {
  Truthy = 'boolean:truthy',
  Falsy = 'boolean:falsy',
}

export enum CommonRuleType {
  Optional = 'optional',
  Default = 'default',
  Refine = 'refine',
  DefaultValues = 'defaultValues',
  Transform = 'transform',
}

export type StringRules = CommonRuleType | StringRuleType;

export type NumberRules = CommonRuleType | NumberRuleType;

export type BooleanRules = CommonRuleType | BooleanRuleType;
