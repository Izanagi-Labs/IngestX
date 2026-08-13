import { Parser, RowsAndHeaders } from "../types";

export class ExcelParser implements Parser {
  constructor(
    private readonly file: File,
    private readonly chunkSize = 10000,
  ) {}

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    const worker = new Worker(new URL("./excel.worker.ts", import.meta.url), {
      type: "module",
    });

    worker.postMessage({
      file: this.file,
      chunkSize: this.chunkSize,
    });

    const queue: RowsAndHeaders[] = [];
    let done = false;
    let workerError: Error | null = null;

    worker.onmessage = (event) => {
      const message = event.data;

      switch (message.type) {
        case "chunk":
          if (!done) {
            queue.push(message.payload);
          }
          break;

        case "done":
          done = true;
          break;

        case "error":
          done = true;
          workerError = new Error(message.error);
          break;
      }
    };

    while (!done || queue.length > 0) {
      if (workerError) {
        worker.terminate();
        throw workerError;
      }
      if (queue.length > 0) {
        yield queue.shift()!;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    if (workerError) {
      worker.terminate();
      throw workerError;
    }

    worker.terminate();
  }
}
