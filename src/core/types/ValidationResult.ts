import type { RuleType } from "./RuleType";

export interface ValidationError {
    rule: RuleType;
    message: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}