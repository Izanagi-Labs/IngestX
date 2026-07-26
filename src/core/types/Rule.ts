export interface Rule<TRuleType> {
  readonly type: TRuleType;
  readonly value?: unknown;
  readonly message?: string;
}
