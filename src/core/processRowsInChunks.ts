import { FinalOutput, RowValidationError, ProcessRowsInChunksOptions } from "../types";
import { validateRow } from "./validateRow";
import { wait } from "../utils";


export async function processRowsInChunks({
  rows,
  columnConfigs,
  chunkSize,
  onChunkProcessed,
  ingestionController,
  options,
}: ProcessRowsInChunksOptions): Promise<FinalOutput> {
  const totalRows = rows.length;
  const finalValidRows: Record<string, any>[] = [];
  const finalInvalidRows: Record<string, any>[] = [];
  const finalRowWiseErrors: RowValidationError[] = [];

  // Initialize duplicate trackers for each column that tracks duplicates
  const duplicateTrackers: Record<string, Set<any>> = {};
  for (const config of columnConfigs) {
    if (config.isDuplicatesAllowed === false) {
      duplicateTrackers[config.key] = new Set();
    }
  }

  for (let i = 0; i < totalRows; i += chunkSize) {
    // 1. Check for pause
    while (ingestionController.isPaused) {
      if (ingestionController.isCancelled) {
        break; // Double check cancel during pause loop
      }
      await wait(100);
    }

    if (ingestionController.isCancelled) {
      break;
    }

    const chunk = rows.slice(i, i + chunkSize);
    const chunkResult: FinalOutput = {
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      validRows: [],
      invalidRows: [],
      errorsData: {
        rowWiseErrors: [],
      },
    };

    // Process each row in chunk
    for (let j = 0; j < chunk.length; j++) {
      const row = chunk[j];
      const actualRowIndex = i + j;

      const { isValid, processedRow, errors } = validateRow(row, columnConfigs, duplicateTrackers, options);

      if (isValid) {
        chunkResult.validRows.push(processedRow);
        if (options?.shouldAccumulateResult !== false) {
          finalValidRows.push(processedRow);
        }
      } else {
        chunkResult.invalidRows.push(processedRow);
        if (options?.shouldAccumulateResult !== false) {
          finalInvalidRows.push(processedRow);
        }

        for (const err of errors) {
          const rowError: RowValidationError = {
            rowIndex: actualRowIndex,
            ...err,
          };
          chunkResult.errorsData.rowWiseErrors.push(rowError);
          finalRowWiseErrors.push(rowError);
        }
      }
    }

    // Call progressive callback
    await onChunkProcessed(chunkResult);
  }

  // Final Output
  return {
    totalRows,
    validRowsCount: finalValidRows.length,
    invalidRowsCount: finalInvalidRows.length,
    validRows: finalValidRows,
    invalidRows: finalInvalidRows,
    errorsData: {
      rowWiseErrors: finalRowWiseErrors,
    },
  };
}
