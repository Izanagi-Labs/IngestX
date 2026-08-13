import Papa from "papaparse";
import { Parser, RowsAndHeaders } from "../types";

export class CSVParser implements Parser {
  constructor(
    private readonly file: File,
    private readonly worker = false,
    private readonly chunkSize = 10000,
  ) {}

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    let headers: string[] = [];
    let startIndex = 0;

    const queue: RowsAndHeaders[] = [];
    let resolveNext: (() => void) | null = null;
    let error: unknown = null;
    let completed = false;

    Papa.parse<Record<string, string>>(this.file, {
      header: true,
      skipEmptyLines: true,
      worker: this.worker,

      chunkSize: this.chunkSize,

      chunk: ({ data, meta }) => {
        headers = meta.fields ?? [];

        queue.push({
          headers,
          rows: data,
          startIndex,
        });

        startIndex += data.length;

        resolveNext?.();
        resolveNext = null;
      },

      complete: () => {
        completed = true;
        resolveNext?.();
      },

      error: (err) => {
        error = err;
        resolveNext?.();
      },
    });

    while (!completed || queue.length) {
      if (error) {
        throw error;
      }

      if (queue.length) {
        yield queue.shift()!;
        continue;
      }

      await new Promise<void>((resolve) => {
        resolveNext = resolve;
      });
    }
  }
}
