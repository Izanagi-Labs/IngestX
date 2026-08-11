export interface RowsAndHeaders {
  headers: string[];
  rows: Record<string, string>[];
  startIndex: number;
}
export interface Parser {
  parse(): AsyncGenerator<RowsAndHeaders>;
}
