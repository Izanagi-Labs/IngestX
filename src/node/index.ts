import {
  ColumnConfig,
  FinalOutput,
  IngestionController,
  IngestionOptions,
} from '../types';
import { processRowsInChunks } from '../core/processRowsInChunks';
import { normalizeHeaders } from '../core/normalizeHeaders';
import { parseCsvToRows, parseExcelToRows } from '../core/parser';

type NodeIngestionOptions = {
  fileContent: string | any;
  fileType?: 'csv' | 'xlsx' | 'xls';
  columnConfigs: ColumnConfig[];
  chunkSize?: number;
  onChunkProcessed?: (result: FinalOutput) => Promise<void>;
  ingestionController?: IngestionController;
  options?: IngestionOptions;
};

/**
 * A lightweight wrapper for Node.js environments.
 */
export async function ingestFileNode({
  fileContent,
  fileType = 'csv',
  columnConfigs,
  chunkSize = 500,
  onChunkProcessed = async () => {},
  ingestionController = { isPaused: false, isCancelled: false },
  options,
}: NodeIngestionOptions): Promise<
  FinalOutput | { error: string; headersMismatch?: any }
> {
  try {
    // 1. Parse File
    let parsedRows: Record<string, any>[] = [];
    if (fileType === 'csv') {
      parsedRows = await parseCsvToRows(fileContent);
    } else if (fileType === 'xlsx' || fileType === 'xls') {
      parsedRows = await parseExcelToRows(fileContent);
    } else {
      return { error: 'Unsupported file type specified.' };
    }

    if (parsedRows.length === 0) {
      return { error: 'No rows found or parsed successfully.' };
    }

    // 2. Validate Headers
    const sentHeaders = Object.keys(parsedRows[0] || {});
    const { normalizedRows, headersMismatch } = normalizeHeaders(
      sentHeaders,
      columnConfigs,
      options,
    );

    if (headersMismatch) {
      return {
        error: 'Headers mismatch',
        headersMismatch,
      };
    }

    // 3. Normalize row keys
    const rowsToProcess = normalizedRows
      ? normalizedRows(parsedRows)
      : parsedRows;

    // 4. Process in Chunks
    const finalOutput = await processRowsInChunks({
      rows: rowsToProcess,
      columnConfigs,
      chunkSize,
      onChunkProcessed,
      ingestionController,
      options,
    });

    return finalOutput;
  } catch (error: any) {
    return {
      error: error.message || 'Failed to process file in Node environment.',
    };
  }
}
