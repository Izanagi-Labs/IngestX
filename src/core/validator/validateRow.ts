import type { RowValidationResult, ValidationContext } from './types';
import { executeRules } from './executeRules';
import { ColumnConfig } from '../../model';

export interface ResolvedColumn {
  header: string; // File/CSV/Excel header to read value from
  column: ColumnConfig; // IngestX schema column
}

export function validateRow<
  TRow extends Record<string, unknown> = Record<string, unknown>,
>(
  row: Record<string, unknown>,
  rowIndex: number,
  columns: readonly ResolvedColumn[],
): RowValidationResult<TRow> {
  const context: ValidationContext = {
    rowIndex,
    row,
  };

  const validatedData: Record<string, unknown> = {};
  const errors: RowValidationResult<TRow>['errors'] = {};

  let valid = true;

  for (const resolvedColumn of columns) {
    const { column, header } = resolvedColumn;

    const fieldResult = executeRules(
      row[header],
      column.schema._getRules(),
      context,
    );

    validatedData[column.key] = fieldResult.value;

    if (!fieldResult.valid) {
      valid = false;
      errors[column.key] = fieldResult.errors;
    }
  }

  return {
    valid,
    rowIndex,
    data: validatedData as TRow,
    errors,
  };
}
