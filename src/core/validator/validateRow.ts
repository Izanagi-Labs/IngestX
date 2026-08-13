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
