import fs from "fs";
import Papa from "papaparse";

import { IngestionCancelledError } from "../../core/errors";
import { Parser, RowsAndHeaders } from "../../core/parser/types";

const DEFAULT_ROW_CHUNK_SIZE = 10_000;
const DEFAULT_READ_HIGH_WATER_MARK = 64 * 1024;

interface PapaParserHandle {
  pause(): void;
  resume(): void;
  abort(): void;
}

interface PapaStepResult {
  data: Record<string, string>;
  errors: Papa.ParseError[];
  meta: Papa.ParseMeta;
}

export class NodeCsvParser implements Parser {
  private readonly headersPromise: Promise<string[]>;

  private resolveHeaders!: (headers: string[]) => void;
  private rejectHeaders!: (error: unknown) => void;

  private headersResolved = false;
  private parserStarted = false;
  private completed = false;
  private aborted = false;

  private parserHandle: PapaParserHandle | null = null;
  private fileStream: fs.ReadStream | null = null;

  private error: unknown = null;

  /**
   * There is intentionally only one output chunk waiting for the consumer.
   *
   * PapaParse is paused as soon as this chunk is ready, so the producer
   * cannot create another output chunk until the consumer has consumed
   * the current one.
   */
  private pendingChunk: RowsAndHeaders | null = null;

  private resolveNext: (() => void) | null = null;

  private currentRows: Record<string, string>[] = [];
  private nextStartIndex = 0;

  constructor(
    private readonly filePath: string,
    private readonly rowChunkSize = DEFAULT_ROW_CHUNK_SIZE,
    private readonly byteChunkSize = DEFAULT_READ_HIGH_WATER_MARK,
  ) {
    if (rowChunkSize <= 0) {
      throw new RangeError("rowChunkSize must be greater than 0");
    }

    if (byteChunkSize <= 0) {
      throw new RangeError("byteChunkSize must be greater than 0");
    }

    this.headersPromise = new Promise<string[]>((resolve, reject) => {
      this.resolveHeaders = resolve;
      this.rejectHeaders = reject;
    });

    /*
     * getHeaders() returns this promise to the caller.
     *
     * If parsing fails before the caller observes the promise, suppress the
     * process-level unhandled rejection while preserving the original
     * rejection for callers that do consume the promise.
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

    this.parserHandle?.abort();
    this.parserHandle = null;

    this.destroyFileStream();

    this.pendingChunk = null;
    this.currentRows = [];

    if (!this.headersResolved) {
      this.headersResolved = true;
      this.rejectHeaders(new IngestionCancelledError());
    }

    this.resolveWaitingConsumer();
  }

  async *parse(): AsyncGenerator<RowsAndHeaders> {
    this.initParser();

    try {
      while (!this.completed || this.pendingChunk !== null) {
        if (this.aborted) {
          return;
        }

        if (this.error) {
          throw this.error;
        }

        if (this.pendingChunk !== null) {
          const chunk = this.pendingChunk;

          this.pendingChunk = null;

          /*
           * The parser was paused when this chunk was created.
           * Resume only after the consumer has taken ownership of it.
           */
          this.resumeParser();

          yield chunk;

          continue;
        }

        await this.waitForProducer();
      }

      if (this.error) {
        throw this.error;
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

    let fileSize: number;

    try {
      fileSize = fs.statSync(this.filePath).size;
    } catch (error) {
      this.handleError(error);
      return;
    }

    try {
      this.fileStream = fs.createReadStream(this.filePath, {
        /*
         * PapaParse itself controls parser-level backpressure.
         *
         * Keep the underlying Node stream buffer small so pause() does not
         * allow a large amount of unread input to accumulate in memory.
         */
        highWaterMark: Math.min(
          this.byteChunkSize,
          DEFAULT_READ_HIGH_WATER_MARK,
        ),
      });

      this.fileStream.on("error", (error) => {
        if (this.aborted) {
          return;
        }

        this.handleError(error);
      });

      Papa.parse<Record<string, string>>(this.fileStream, {
        header: true,
        skipEmptyLines: true,

        /*
         * IMPORTANT:
         *
         * Do not use chunk() here.
         *
         * chunk() allows PapaParse to materialize an entire input chunk
         * before our callback executes. step() lets us pause immediately
         * after rowChunkSize rows have been accumulated.
         *
         * PapaParse's Node ReadableStreamStreamer supports pause/resume.
         */
        step: (results, parser) => {
          this.handleStep(
            results as PapaStepResult,
            parser as unknown as PapaParserHandle,
            fileSize,
          );
        },

        complete: () => {
          this.handleComplete();
        },

        error: (error) => {
          this.handleError(error);
        },
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  private handleStep(
    results: PapaStepResult,
    parser: PapaParserHandle,
    fileSize: number,
  ): void {
    if (this.aborted) {
      parser.abort();
      return;
    }

    this.parserHandle = parser;

    const headers = results.meta.fields ?? [];

    this.headers = headers;

    if (!this.headersResolved) {
      this.headersResolved = true;
      this.resolveHeaders(headers);
    }

    if (results.errors.length > 0) {
      this.handleError(results.errors[0]);
      parser.abort();
      return;
    }

    this.currentRows.push(results.data);

    if (this.currentRows.length < this.rowChunkSize) {
      return;
    }

    const chunk = this.createChunk(headers, this.currentRows, fileSize);

    this.currentRows = [];

    this.pendingChunk = chunk;

    parser.pause();

    this.resolveWaitingConsumer();
  }

  private handleComplete(): void {
    if (this.aborted) {
      return;
    }

    if (this.currentRows.length > 0 && this.pendingChunk === null) {
      this.pendingChunk = this.createChunk(
        this.headers,
        this.currentRows,
        this.getFileSizeSafely(),
      );

      this.currentRows = [];
    }

    if (!this.headersResolved) {
      this.headersResolved = true;
      this.resolveHeaders(this.headers);
    }

    this.completed = true;

    this.resolveWaitingConsumer();
  }

  private createChunk(
    headers: string[],
    rows: Record<string, string>[],
    fileSize: number,
  ): RowsAndHeaders {
    const processedBytes = this.getProcessedBytes(fileSize);

    const progress = fileSize > 0 ? Math.min(1, processedBytes / fileSize) : 0;

    const startIndex = this.nextStartIndex;

    this.nextStartIndex += rows.length;

    return {
      headers,
      rows,
      startIndex,
      progress,
      processedBytes,
    };
  }

  private getProcessedBytes(fileSize: number): number {
    if (!this.fileStream || fileSize <= 0) {
      return 0;
    }

    /*
     * ReadStream.bytesRead is an actual byte count from the filesystem.
     *
     * This is intentionally used instead of PapaParse meta.cursor.
     * meta.cursor is based on JavaScript string character positions and
     * therefore cannot safely be divided by a UTF-8 file's byte length.
     */
    return Math.min(this.fileStream.bytesRead, fileSize);
  }

  private headers: string[] = [];

  private resumeParser(): void {
    if (this.aborted || this.completed || !this.parserHandle) {
      return;
    }

    this.parserHandle.resume();
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

  private handleError(error: unknown): void {
    if (this.aborted) {
      return;
    }

    this.error = error;

    if (!this.headersResolved) {
      this.headersResolved = true;
      this.rejectHeaders(error);
    }

    this.resolveWaitingConsumer();
  }

  private cleanup(): void {
    this.parserHandle?.abort();
    this.parserHandle = null;

    this.destroyFileStream();

    this.pendingChunk = null;
    this.currentRows = [];
    this.resolveNext = null;
  }

  private destroyFileStream(): void {
    if (!this.fileStream) {
      return;
    }

    this.fileStream.destroy();
    this.fileStream = null;
  }

  private getFileSizeSafely(): number {
    try {
      return fs.statSync(this.filePath).size;
    } catch {
      return 0;
    }
  }
}
