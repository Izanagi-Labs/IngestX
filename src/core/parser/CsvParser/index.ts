import Papa from "papaparse";
import { Parser, RowsAndHeaders } from "../types";
import { IngestionCancelledError } from "../../errors";

const MAX_BUFFERED_CHUNKS = 2;

export class CSVParser implements Parser {
  private isAborted = false;
  private papaParser: any = null;
  private resolveNext: (() => void) | null = null;

  private headersPromise: Promise<string[]>;
  private resolveHeaders!: (headers: string[]) => void;
  private rejectHeaders!: (error: unknown) => void;
  private headersResolvedFlag = false;

  constructor(
    private readonly file: File,
    private readonly worker = false,
    private readonly rowChunkSize = 10000,
    private readonly byteChunkSize = 10485760,
  ) {
    this.headersPromise = new Promise((resolve, reject) => {
      this.resolveHeaders = resolve;
      this.rejectHeaders = reject;
    });
    this.headersPromise.catch(() => {});
  }

  getHeaders(): Promise<string[]> {
    this.initParser();
    return this.headersPromise;
  }

  abort(): void {
    this.isAborted = true;
    if (this.papaParser) {
      this.papaParser.abort();
    }
    this.resolveNext?.();
    if (!this.headersResolvedFlag) {
      this.rejectHeaders(new IngestionCancelledError());
      this.headersResolvedFlag = true;
    }
  }

  private parserInitiated = false;
  private queue: RowsAndHeaders[] = [];
  private error: unknown = null;
  private completed = false;

  private initParser(): void {
    if (this.parserInitiated) return;
    this.parserInitiated = true;

    let headers: string[] = [];
    let startIndex = 0;

    Papa.parse<Record<string, string>>(this.file, {
      header: true,
      skipEmptyLines: true,
      worker: this.worker,

      chunkSize: this.byteChunkSize,

      chunk: ({ data, meta }, parser) => {
        this.papaParser = parser;
        if (this.isAborted) {
          parser.abort();
          return;
        }

        headers = meta.fields ?? [];
        
        if (!this.headersResolvedFlag) {
          this.resolveHeaders(headers);
          this.headersResolvedFlag = true;
        }

        const progress = Math.min(1, meta.cursor / this.file.size);

        for (let i = 0; i < data.length; i += this.rowChunkSize) {
          const chunkRows = data.slice(i, i + this.rowChunkSize);
          this.queue.push({
            headers,
            rows: chunkRows,
            startIndex,
            progress,
            processedBytes: meta.cursor,
          });
          startIndex += chunkRows.length;
        }

        if (data.length === 0) {
          this.queue.push({
            headers,
            rows: [],
            startIndex,
            progress,
            processedBytes: meta.cursor,
          });
        }

        if (this.queue.length >= MAX_BUFFERED_CHUNKS) {
          parser.pause();
        }

        this.resolveNext?.();
        this.resolveNext = null;
      },

      complete: () => {
        if (!this.headersResolvedFlag) {
          this.resolveHeaders([]);
          this.headersResolvedFlag = true;
        }
        this.completed = true;
        this.resolveNext?.();
      },

      error: (err) => {
        if (!this.headersResolvedFlag) {
          this.rejectHeaders(err);
          this.headersResolvedFlag = true;
        }
        this.error = err;
        this.resolveNext?.();
      },
    });
  }

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    this.initParser();

    try {
      while (!this.completed || this.queue.length) {
        if (this.isAborted) {
          break;
        }

        if (this.error) {
          throw this.error;
        }

        if (this.queue.length) {
          const chunk = this.queue.shift()!;
          if (this.queue.length < MAX_BUFFERED_CHUNKS && this.papaParser) {
            this.papaParser.resume();
          }
          yield chunk;
          continue;
        }

        await new Promise<void>((resolve) => {
          this.resolveNext = resolve;
        });
      }
    } finally {
      this.abort();
    }
  }
}
