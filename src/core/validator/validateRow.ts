import { RowValidationResult, ValidationContext, ValidationErrorType } from "./types";
import { executeRules } from "./executeRules";
import { ResolvedColumn } from "../headers/types";

export function validateRow<TRow>(
  row: Record<string, string>,
  rowIndex: number,
  columns: readonly ResolvedColumn[],
  uniqueTracker: Map<string, Set<unknown>>,
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
    } else if (column.duplicatesAllowed === false) {
      let set = uniqueTracker.get(column.key);
      if (!set) {
        set = new Set();
        uniqueTracker.set(column.key, set);
      }
      
      if (set.has(fieldResult.value)) {
        valid = false;
        if (!errors[column.key]) {
          errors[column.key] = [];
        }
        
        errors[column.key].push({
          rule: ValidationErrorType.DuplicateValue,
          message: "Value must be unique.",
        });
        
        if (!originalData) {
          originalData = {};
        }
        originalData[column.key] = rawValue;
      } else {
        set.add(fieldResult.value);
      }
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
