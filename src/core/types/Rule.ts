import type { RuleType } from "./RuleType";

export interface Rule<T = unknown> {
    type: RuleType;
    value?: T;
    message?: string;
}