import fs from "fs";
import * as XLSX from "xlsx";

import { Parser, RowsAndHeaders } from "../../core/parser/types";
import { IngestionCancelledError } from "../../core/errors";

const DEFAULT_ROW_CHUNK_SIZE = 10_000;

export class NodeExcelParser implements Parser {
  private readonly headersPromise: Promise<string[]>;

  private resolveHeaders!: (headers: string[]) => void;
  private rejectHeaders!: (error: unknown) => void;

  private headersResolved = false;
  private parserStarted = false;
  private completed = false;
  private aborted = false;

  private error: unknown = null;

  private resolveNext: (() => void) | null = null;

  /**
   * Workbook rows are retained by SheetJS for the lifetime of the parser.
   *
   * IngestX intentionally keeps only one output chunk pending at a time,
   * preventing an additional queue of the entire workbook.
   */
  private workbook: XLSX.WorkBook | null = null;
  private rows: Record<string, string>[] | null = null;

  private headers: string[] = [];
  private nextRowIndex = 0;
  private nextChunkIndex = 0;

  constructor(
    private readonly filePath: string,
    private readonly rowChunkSize = DEFAULT_ROW_CHUNK_SIZE,
  ) {
    if (rowChunkSize <= 0) {
      throw new RangeError("rowChunkSize must be greater than 0");
    }

    this.headersPromise = new Promise<string[]>((resolve, reject) => {
      this.resolveHeaders = resolve;
      this.rejectHeaders = reject;
    });

    /*
     * The promise is intentionally exposed through getHeaders().
     * Prevent an unhandled rejection if parsing fails before the
     * caller consumes getHeaders().
     */
    this.headersPromise.catch(() => {});
  }

  getHeaders(): Promise<string[]> {
    this.initParser();

    return this.headersPromise;
  }

  abort(): void {
    if (this.aborted) {
      return;
    }

    this.aborted = true;

    /*
     * SheetJS parsing is synchronous in V1, so cancellation cannot
     * interrupt XLSX.readFile() once it has started.
     *
     * This flag prevents any subsequent output from being emitted.
     */
    this.clearParsedData();

    if (!this.headersResolved) {
      this.headersResolved = true;
      this.rejectHeaders(new IngestionCancelledError());
    }

    this.resolveWaitingConsumer();
  }

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    this.initParser();

    try {
      while (!this.completed || (this.rows && this.nextRowIndex < this.rows.length)) {
        if (this.aborted) {
          return;
        }

        if (this.error) {
          throw this.error;
        }

        const chunk = this.createNextChunk();

        if (chunk) {
          yield chunk;
          continue;
        }

        if (this.completed) {
          break;
        }

        /*
         * No chunk currently available.
         *
         * The parser runs asynchronously via setImmediate(), so wait
         * for initialization to complete.
         */
        await this.waitForProducer();
      }

      if (this.error) {
        throw this.error;
      }

      /*
       * The producer may finish with zero rows.
       */
      if (this.rows && this.rows.length === 0 && this.nextChunkIndex === 0) {
        this.nextChunkIndex += 1;

        yield {
          headers: this.headers,
          rows: [],
          startIndex: 0,
          progress: 1,
          totalRows: 0,
          processedBytes: this.getFileSize(),
        };
      }
    } finally {
      this.cleanup();
    }
  }

  private initParser(): void {
    if (this.parserStarted) {
      return;
    }

    this.parserStarted = true;

    /*
     * XLSX.readFile() is synchronous.
     *
     * setImmediate prevents the constructor/getHeaders() call itself
     * from blocking immediately, but does NOT make SheetJS parsing
     * asynchronous or interruptible.
     */
    setImmediate(() => {
      if (this.aborted) {
        return;
      }

      try {
        const fileSize = this.getFileSize();

        this.workbook = XLSX.readFile(this.filePath, {
          cellDates: true,
        });

        if (this.aborted) {
          return;
        }

        const sheetName = this.workbook.SheetNames[0];

        if (!sheetName) {
          throw new Error("No sheets found in Excel file");
        }

        const worksheet = this.workbook.Sheets[sheetName];

        if (!worksheet) {
          throw new Error(`Worksheet "${sheetName}" could not be read`);
        }

        /*
         * header: 1 gives us the actual first row and avoids
         * relying on Object.keys(data[0]) for header discovery.
         */
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          raw: false,
          defval: "",
          blankrows: false,
        });

        if (rawRows.length === 0) {
          this.headers = [];
          this.rows = [];
        } else {
          this.headers = this.normalizeHeaders(rawRows[0]);

          this.rows = this.convertRows(rawRows.slice(1), this.headers);
        }

        if (!this.headersResolved) {
          this.headersResolved = true;
          this.resolveHeaders(this.headers);
        }

        /*
         * Keep the actual file size as metadata.
         *
         * We do NOT claim that the parser processed bytes
         * incrementally because SheetJS reads the workbook as a
         * whole.
         */
        void fileSize;

        this.completed = true;

        this.resolveWaitingConsumer();
      } catch (error) {
        this.handleError(error);
      }
    });
  }

  private createNextChunk(): RowsAndHeaders | null {
    if (!this.rows || this.nextRowIndex >= this.rows.length) {
      return null;
    }

    const totalRows = this.rows.length;

    const endIndex = Math.min(this.nextRowIndex + this.rowChunkSize, totalRows);

    const chunkRows = this.rows.slice(this.nextRowIndex, endIndex);

    const startIndex = this.nextRowIndex;

    this.nextRowIndex = endIndex;
    this.nextChunkIndex += 1;

    return {
      headers: this.headers,
      rows: chunkRows,
      startIndex,
      progress: totalRows > 0 ? Math.min(1, endIndex / totalRows) : 1,
      totalRows,
      processedBytes: endIndex >= totalRows ? this.getFileSize() : 0,
    };
  }

  private normalizeHeaders(rawHeaders: unknown[] | undefined): string[] {
    if (!rawHeaders) {
      return [];
    }

    return rawHeaders.map((header, index) => {
      const value = String(header ?? "").trim();

      return value || `Column${index + 1}`;
    });
  }

  private convertRows(
    rawRows: unknown[][],
    headers: string[],
  ): Record<string, string>[] {
    return rawRows.map((rawRow) => {
      const row: Record<string, string> = {};

      for (
        let columnIndex = 0;
        columnIndex < headers.length;
        columnIndex += 1
      ) {
        const header = headers[columnIndex];

        row[header] = this.stringifyCell(rawRow[columnIndex]);
      }

      return row;
    });
  }

  private stringifyCell(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }

    return String(value);
  }

  private getFileSize(): number {
    try {
      return fs.statSync(this.filePath).size;
    } catch {
      return 0;
    }
  }

  private handleError(error: unknown): void {
    if (this.aborted) {
      return;
    }

    this.error = error;

    if (!this.headersResolved) {
      this.headersResolved = true;
      this.rejectHeaders(error);
    }

    this.completed = true;

    this.resolveWaitingConsumer();
  }

  private waitForProducer(): Promise<void> {
    return new Promise<void>((resolve) => {
      this.resolveNext = resolve;
    });
  }

  private resolveWaitingConsumer(): void {
    const resolve = this.resolveNext;

    if (!resolve) {
      return;
    }

    this.resolveNext = null;
    resolve();
  }

  private cleanup(): void {
    this.clearParsedData();
    this.resolveNext = null;
  }

  private clearParsedData(): void {
    this.rows = null;
    this.workbook = null;
  }
}
