export interface ValidationError<TRuleType extends string> {
  rule: TRuleType;
  message: string;
}

export interface ValidationResult<TRuleType extends string, TValue> {
  value: TValue;
  valid: boolean;
  errors: ValidationError<TRuleType>[];
}
