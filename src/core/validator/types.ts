import { RuleType } from '../../model/schema/types/RuleType';
import { ValidationError } from '../../model/schema/types/ValidationResult';

export enum ValidationErrorType {
  InvalidType = 'invalid_type',
  Required = 'required',
}

export type RuleWithValidationType = RuleType | ValidationErrorType;

export interface RuleExecutionState {
  value: unknown;
  errors: ValidationError<RuleWithValidationType>[];
  stop: boolean;
  caseSensitive?: boolean;
}

export interface ValidationContext {
  rowIndex: number;
  row: Record<string, unknown>;
}

export interface FieldValidationResult {
  valid: boolean;
  value: unknown;
  errors: ValidationError<RuleWithValidationType>[];
}

export interface RowValidationResult<TRow = Record<string, unknown>> {
  valid: boolean;
  rowIndex: number;
  data: TRow;
  errors: Record<string, ValidationError<RuleWithValidationType>[]>;
}

export interface ChunkValidationResult<TRow = Record<string, unknown>> {
  validRows: RowValidationResult<TRow>[];
  invalidRows: RowValidationResult<TRow>[];
}
