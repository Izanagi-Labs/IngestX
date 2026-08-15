import Papa from "papaparse";
import { Parser, RowsAndHeaders } from "../types";

const MAX_BUFFERED_CHUNKS = 2;

export class CSVParser implements Parser {
  private isAborted = false;
  private papaParser: any = null;
  private resolveNext: (() => void) | null = null;

  constructor(
    private readonly file: File,
    private readonly worker = false,
    private readonly chunkSize = 10000,
  ) {}

  abort(): void {
    this.isAborted = true;
    if (this.papaParser) {
      this.papaParser.abort();
    }
    this.resolveNext?.();
  }

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    try {
      let headers: string[] = [];
      let startIndex = 0;

      const queue: RowsAndHeaders[] = [];
      let error: unknown = null;
      let completed = false;

      Papa.parse<Record<string, string>>(this.file, {
        header: true,
        skipEmptyLines: true,
        worker: this.worker,

        chunkSize: this.chunkSize,

        chunk: ({ data, meta }, parser) => {
          this.papaParser = parser;
          if (this.isAborted) {
            parser.abort();
            return;
          }

          headers = meta.fields ?? [];

          queue.push({
            headers,
            rows: data,
            startIndex,
          });

          startIndex += data.length;

          if (queue.length >= MAX_BUFFERED_CHUNKS) {
            parser.pause();
          }

          this.resolveNext?.();
          this.resolveNext = null;
        },

        complete: () => {
          completed = true;
          this.resolveNext?.();
        },

        error: (err) => {
          error = err;
          this.resolveNext?.();
        },
      });

      while (!completed || queue.length) {
        if (this.isAborted) {
          break;
        }

        if (error) {
          throw error;
        }

        if (queue.length) {
          const chunk = queue.shift()!;
          if (queue.length < MAX_BUFFERED_CHUNKS && this.papaParser) {
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
