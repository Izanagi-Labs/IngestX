export interface RowsAndHeaders {
  headers: string[];
  rows: Record<string, string>[];
  startIndex: number;
}
export interface Parser {
  parse(): AsyncGenerator<RowsAndHeaders>;
  /**
   * Aborts the parsing operation and releases underlying resources.
   * We use `abort` to align with standard cancellation semantics (like AbortController).
   * It allows the consumer to explicitly or implicitly terminate the parser/worker
   * when stopping early (e.g. during errors, manual cancellation).
   */
  abort(): void;
}
