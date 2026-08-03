import { ColumnConfig } from '../../model/column/types';
import { RowValidationResult, ValidationContext } from './types';
import { executeRules } from './executeRules';

export function validateRow<TRow extends Record<string, unknown> = Record<string, unknown>>(
  row: TRow,
  rowIndex: number,
  columns: ColumnConfig[],
): RowValidationResult<TRow> {
  const context: ValidationContext = { rowIndex, row };
  const validatedData: Record<string, unknown> = {};
  const errors: RowValidationResult<TRow>['errors'] = {};
  let isValid = true;

  for (const column of columns) {
    const rawValue = row[column.key] !== undefined ? row[column.key] : row[column.name];

    const rules = column.schema._getRules();

    const fieldResult = executeRules(rawValue, rules, context);

    if (!fieldResult.valid) {
      isValid = false;
      errors[column.key] = fieldResult.errors;
    }

    validatedData[column.key] = fieldResult.value;
  }

  return {
    valid: isValid,
    rowIndex,
    data: validatedData as TRow,
    errors,
  };
}
