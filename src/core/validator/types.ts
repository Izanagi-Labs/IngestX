import { RuleType } from '../../model/schema/types/RuleType';
import { ValidationError } from '../../model/schema/types/ValidationResult';

export interface RuleExecutionState {
  value: unknown;
  errors: ValidationError<RuleType>[];
  stop: boolean;
}

export interface ValidationContext {
  rowIndex: number;
  row: Record<string, unknown>;
}

export interface FieldValidationResult {
  valid: boolean;
  value: unknown;
  errors: ValidationError<RuleType>[];
}

export interface RowValidationResult<TRow = Record<string, unknown>> {
  valid: boolean;
  rowIndex: number;
  data: TRow;
  errors: Record<string, ValidationError<RuleType>[]>;
}

export interface ChunkValidationResult<TRow = Record<string, unknown>> {
  validRows: RowValidationResult<TRow>[];
  invalidRows: RowValidationResult<TRow>[];
}
