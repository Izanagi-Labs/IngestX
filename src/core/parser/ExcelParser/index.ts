import { Parser, RowsAndHeaders } from "../types";

const MAX_BUFFERED_CHUNKS = 2;

export class ExcelParser implements Parser {
  private worker: Worker | null = null;
  private isAborted = false;
  private resolveNext: (() => void) | null = null;

  constructor(
    private readonly file: File,
    private readonly chunkSize = 10000,
  ) {}

  abort(): void {
    this.isAborted = true;
    if (this.worker) {
      this.worker.terminate();
    }
    this.resolveNext?.();
  }

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    try {
      this.worker = new Worker(new URL("./excel.worker.ts", import.meta.url), {
        type: "module",
      });

      if (this.isAborted) {
        this.worker.terminate();
        return;
      }

      this.worker.postMessage({
        type: "init",
        file: this.file,
        chunkSize: this.chunkSize,
      });

      const queue: RowsAndHeaders[] = [];
      let done = false;
      let workerError: Error | null = null;
      let requestedChunks = 0;
      let receivedChunks = 0;

      const requestMore = () => {
        if (!this.worker || done || workerError || this.isAborted) return;
        const inFlight = requestedChunks - receivedChunks;
        const canRequest = MAX_BUFFERED_CHUNKS - queue.length - inFlight;
        for (let i = 0; i < canRequest; i++) {
          this.worker.postMessage({ type: "next" });
          requestedChunks++;
        }
      };

      this.worker.onmessage = (event) => {
        const message = event.data;

        switch (message.type) {
          case "ready":
            requestMore();
            break;
          case "chunk":
            if (!done) {
              receivedChunks++;
              queue.push(message.payload);
              requestMore();
              this.resolveNext?.();
              this.resolveNext = null;
            }
            break;

          case "done":
            done = true;
            this.resolveNext?.();
            this.resolveNext = null;
            break;

          case "error":
            done = true;
            workerError = new Error(message.error);
            this.resolveNext?.();
            this.resolveNext = null;
            break;
        }
      };

      while (!done || queue.length > 0) {
        if (this.isAborted) {
          break;
        }
        if (workerError) {
          throw workerError;
        }
        if (queue.length > 0) {
          yield queue.shift()!;
          requestMore();
        } else {
          await new Promise<void>((resolve) => {
            this.resolveNext = resolve;
          });
        }
      }

      if (workerError) {
        throw workerError;
      }
    } finally {
      this.abort();
    }
  }
}
