import { ColumnConfig } from "../../model";
import { IngestionStatus } from "../controller/types";
import { RowValidationResult } from "../validator";
import { HeadersMismatch } from "../headers/types";

export enum IngestionErrorType {
  HEADER_MISMATCH = "HEADER_MISMATCH",
  INGESTION_ERROR = "INGESTION_ERROR",
  COLLECTION_LIMIT_EXCEEDED = "COLLECTION_LIMIT_EXCEEDED",
}

export interface IngestionError {
  type: IngestionErrorType;
  message: string;
  details?: unknown;
  cause?: unknown;
}

export interface HeaderMismatchError extends IngestionError {
  type: IngestionErrorType.HEADER_MISMATCH;
  details: HeadersMismatch;
}

export interface IngestionResult<TRow> {
  status: IngestionStatus;
  data: FinalOutput<TRow>;
  error: IngestionError | HeaderMismatchError | null;
}

export interface ChunkValidationResult<TRow> {
  validRows: RowValidationResult<TRow>[];
  invalidRows: RowValidationResult<TRow>[];
}

export interface ChunkResult<TRow> {
  chunkIndex: number;
  totalChunks?: number;

  output: ChunkValidationResult<TRow>;
  progress: number;
  processedRows: number;
}

export type ProgressBasis = "bytes" | "rows" | "indeterminate";

export interface Progress {
  phase: "initializing" | "parsing" | "completed" | "cancelled" | "failed";
  processedRows: number;
  totalRows?: number;
  processedBytes?: number;
  totalBytes?: number;
  percentage?: number;
  basis: ProgressBasis;
}

export interface IngestOptions<TRow> {
  file: File;
  columns: ColumnConfig[];
  worker?: boolean;
  chunkSize?: number;
  byteChunkSize?: number;
  /**
   * If true, every parsed and validated row (both valid and invalid) is accumulated in memory
   * and returned in `IngestionResult.data`.
   *
   * WARNING: For large files (e.g., 500MB+), this will result in O(N) memory growth
   * proportional to the dataset size, potentially crashing the browser.
   * For large files, leave this false and use `onChunkProcessed` to handle rows incrementally.
   */
  collectResults?: boolean;
  /**
   * Hard upper bound on the number of rows retained when `collectResults` is true.
   * If the number of collected rows exceeds this limit, ingestion will immediately fail.
   */
  maxCollectedRows?: number;
  onChunkProcessed?(data: ChunkResult<TRow>): void | Promise<void>;
  onProgress?: (progress: Progress) => void;
}

export interface IngestionInstance<TRow> {
  pause(): void;

  resume(): void;

  cancel(): void;

  get status(): IngestionStatus;

  result: Promise<IngestionResult<TRow>>;
}

export type RowValidationError = {
  rowIndex: number;
  columnKey: string;
  receivedValue: unknown;
  errorMessage: string;
};

export type ErrorsData = {
  rowWiseErrors: RowValidationError[];
};

export type FinalOutput<TRow = Record<string, unknown>> = {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  validRows: TRow[];
  invalidRows: TRow[];
  errorsData: ErrorsData;
};

export type ParserOptions = Pick<
  IngestOptions<any>,
  "worker" | "chunkSize" | "byteChunkSize"
>;

export type ParserFactory = (
  file: File,
  options?: ParserOptions,
) => import("../parser/types").Parser;
