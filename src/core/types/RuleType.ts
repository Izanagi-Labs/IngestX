export enum StringRuleType {
  Min = 'string:min',
  Max = 'string:max',
  Regex = 'string:regex',
  AllowedValues = 'string:allowed-values',
  caseSensitive = 'string:case-sensitive',
}

export enum NumberRuleType {
  Min = 'number:min',
  Max = 'number:max',
  AllowedValues = 'number:allowed-values',
}

export enum BooleanRuleType {
  Truthy = 'boolean:truthy',
  Falsy = 'boolean:falsy',
  caseSensitive = 'string:case-sensitive',
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
