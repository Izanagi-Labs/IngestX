import { ColumnConfig } from '../../model/column/types';
import { ChunkValidationResult, RowValidationResult } from './types';
import { validateRow } from './validateRow';

export interface ResolvedColumn {
  header: string; // File/CSV/Excel header to read value from
  column: ColumnConfig; // IngestX schema column
}

export function validateChunk<
  TRow extends Record<string, unknown> = Record<string, unknown>,
>(
  chunk: TRow[],
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
