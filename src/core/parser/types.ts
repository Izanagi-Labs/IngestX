export interface RowsAndHeaders {
  headers: string[];
  rows: Record<string, string>[];
  startIndex: number;
  progress: number;
  totalRows?: number;
  processedBytes?: number;
}
export interface Parser {
  getHeaders(): Promise<string[]>;
  parse(): AsyncGenerator<RowsAndHeaders>;
  /**
   * Aborts the parsing operation and releases underlying resources.
   * We use `abort` to align with standard cancellation semantics (like AbortController).
   * It allows the consumer to explicitly or implicitly terminate the parser/worker
   * when stopping early (e.g. during errors, manual cancellation).
   */
  abort(): void;
}


