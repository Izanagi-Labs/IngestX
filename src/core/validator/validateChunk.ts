import { ResolvedColumn } from '../headers/types';
import { ChunkValidationResult, RowValidationResult } from './types';
import { validateRow } from './validateRow';

export function validateChunk<TRow>(
  chunk: Record<string, string>[],
  startIndex: number,
  columns: ResolvedColumn[],
): ChunkValidationResult<TRow> {
  const validRows: RowValidationResult<TRow>[] = [];
  const invalidRows: RowValidationResult<TRow>[] = [];

  for (let i = 0; i < chunk.length; i++) {
    const row = chunk[i];
    const absoluteIndex = startIndex + i;
    const rowResult = validateRow<TRow>(row, absoluteIndex, columns);

    if (rowResult.valid) {
      validRows.push(rowResult);
    } else {
      invalidRows.push(rowResult);
    }
  }

  return {
    validRows,
    invalidRows,
  };
}
