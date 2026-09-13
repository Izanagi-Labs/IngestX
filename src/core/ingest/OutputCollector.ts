import type {
  FinalOutput,
  RowValidationError,
  ChunkValidationResult,
} from "./types";

import { CollectionLimitExceededError } from "../errors";

export class OutputCollector<TRow = Record<string, any>> {
  private totalRows = 0;
  private validRowsCount = 0;
  private invalidRowsCount = 0;

  private validRows: TRow[] = [];
  private invalidRows: TRow[] = [];
  private rowWiseErrors: RowValidationError[] = [];

  constructor(
    private collectResults: boolean = false,
    private maxCollectedRows?: number,
  ) {}

  public add(chunkResult: ChunkValidationResult<TRow>): void {
    const incomingValid = chunkResult.validRows.length;
    const incomingInvalid = chunkResult.invalidRows.length;
    const incomingRetained = incomingValid + incomingInvalid;

    if (this.collectResults && this.maxCollectedRows !== undefined) {
      const currentRetained = this.validRows.length + this.invalidRows.length;
      if (currentRetained + incomingRetained > this.maxCollectedRows) {
        throw new CollectionLimitExceededError(this.maxCollectedRows);
      }
    }

    this.totalRows += incomingRetained;
    this.validRowsCount += incomingValid;
    this.invalidRowsCount += incomingInvalid;

    if (this.collectResults) {
      for (const valid of chunkResult.validRows) {
        this.validRows.push(valid.data);
      }

      for (const invalid of chunkResult.invalidRows) {
        this.invalidRows.push(invalid.data);

        for (const [columnKey, errors] of Object.entries(invalid.errors)) {
          for (const err of errors) {
            const receivedValue =
              invalid.originalData && columnKey in invalid.originalData
                ? invalid.originalData[columnKey]
                : (invalid.data as Record<string, any>)[columnKey];

            this.rowWiseErrors.push({
              rowIndex: invalid.rowIndex,
              columnKey,
              receivedValue,
              errorMessage: err.message,
            });
          }
        }
      }
    }
  }

  public getFinalOutput(): FinalOutput<TRow> {
    return {
      totalRows: this.totalRows,
      validRowsCount: this.validRowsCount,
      invalidRowsCount: this.invalidRowsCount,
      validRows: this.validRows,
      invalidRows: this.invalidRows,
      errorsData: {
        rowWiseErrors: this.rowWiseErrors,
      },
    };
  }
}
