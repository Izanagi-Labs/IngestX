import { Parser, RowsAndHeaders } from "../types";
import { IngestionCancelledError } from "../../errors";
// @ts-ignore - Vite worker import
import ExcelWorker from "./excel.worker.ts?worker&inline";

const MAX_BUFFERED_CHUNKS = 4;

export class ExcelParser implements Parser {
  private worker: Worker | null = null;
  private isAborted = false;
  private resolveNext: (() => void) | null = null;

  private headersPromise: Promise<string[]>;
  private resolveHeaders!: (headers: string[]) => void;
  private rejectHeaders!: (error: unknown) => void;
  private headersResolvedFlag = false;

  constructor(
    private readonly file: File,
    private readonly rowChunkSize = 10000,
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
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
    this.resolveNext?.();
    if (!this.headersResolvedFlag) {
      this.rejectHeaders(new IngestionCancelledError());
      this.headersResolvedFlag = true;
    }
  }

  private parserInitiated = false;
  private queue: RowsAndHeaders[] = [];
  private done = false;
  private workerError: Error | null = null;
  private requestedChunks = 0;
  private receivedChunks = 0;

  private requestMore = () => {
    if (!this.worker || this.done || this.workerError || this.isAborted) return;
    const inFlight = this.requestedChunks - this.receivedChunks;
    const canRequest = MAX_BUFFERED_CHUNKS - this.queue.length - inFlight;
    for (let i = 0; i < canRequest; i++) {
      this.worker.postMessage({ type: "next" });
      this.requestedChunks++;
    }
  };

  private initParser(): void {
    if (this.parserInitiated) return;
    this.parserInitiated = true;

    this.worker = new ExcelWorker() as Worker;

    if (this.isAborted) {
      this.worker.terminate();
      return;
    }

    this.worker.postMessage({
      type: "init",
      file: this.file,
      rowChunkSize: this.rowChunkSize,
    });

    this.worker.onmessage = (event) => {
      const message = event.data;

      switch (message.type) {
        case "ready":
          if (!this.headersResolvedFlag) {
            this.resolveHeaders(message.headers);
            this.headersResolvedFlag = true;
          }
          this.requestMore();
          break;
        case "chunk":
          if (!this.done) {
            this.receivedChunks++;
            this.queue.push(message.payload);
            this.requestMore();
            this.resolveNext?.();
            this.resolveNext = null;
          }
          break;

        case "done":
          this.done = true;
          this.resolveNext?.();
          this.resolveNext = null;
          break;

        case "error":
          this.done = true;
          this.workerError = new Error(message.error);
          if (!this.headersResolvedFlag) {
            this.rejectHeaders(this.workerError);
            this.headersResolvedFlag = true;
          }
          this.resolveNext?.();
          this.resolveNext = null;
          break;
      }
    };
  }

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    this.initParser();

    try {
      while (!this.done || this.queue.length > 0) {
        if (this.isAborted) {
          break;
        }
        if (this.workerError) {
          throw this.workerError;
        }
        if (this.queue.length > 0) {
          yield this.queue.shift()!;
          this.requestMore();
        } else {
          await new Promise<void>((resolve) => {
            this.resolveNext = resolve;
          });
        }
      }

      if (this.workerError) {
        throw this.workerError;
      }
    } finally {
      this.abort();
    }
  }
}
