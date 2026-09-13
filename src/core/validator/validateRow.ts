import type { RowValidationResult, ValidationContext } from "./types";
import { executeRules } from "./executeRules";
import { ResolvedColumn } from "../headers/types";

export function validateRow<TRow>(
  row: Record<string, string>,
  rowIndex: number,
  columns: readonly ResolvedColumn[],
): RowValidationResult<TRow> {
  const context: ValidationContext = {
    rowIndex,
    row,
  };

  const validatedData: Record<string, unknown> = {};
  const errors: RowValidationResult<TRow>["errors"] = {};
  let originalData: Record<string, unknown> | undefined = undefined;

  let valid = true;

  for (const resolvedColumn of columns) {
    const { column, header } = resolvedColumn;
    const rawValue = row[header];

    const fieldResult = executeRules(
      rawValue,
      column.schema._getRules(),
      context,
    );

    validatedData[column.key] = fieldResult.value;

    if (!fieldResult.valid) {
      valid = false;
      errors[column.key] = fieldResult.errors;

      if (!originalData) {
        originalData = {};
      }
      originalData[column.key] = rawValue;
    }
  }

  const result: RowValidationResult<TRow> = {
    valid,
    rowIndex,
    data: validatedData as TRow,
    errors,
  };

  if (originalData) {
    result.originalData = originalData;
  }

  return result;
}
