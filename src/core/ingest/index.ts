import { IngestionController } from "../controller/IngestionController";
import { IngestionStatus } from "../controller/types";
import { resolveHeaders } from "../headers/resolveHeaders";
import { validateChunk } from "../validator/validateChunk";
import { OutputCollector } from "./OutputCollector";
import { isIngestionCancelledError } from "../errors";
import { cooperativeYield } from "./cooperativeYield";
import { ProgressTracker } from "./ProgressTracker";

import {
  type IngestionInstance,
  type IngestOptions,
  type IngestionResult,
  IngestionErrorType,
} from "./types";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected ingestion error.";
}

async function runIngestion<TRow>(
  controller: IngestionController,
  options: IngestOptions<TRow>,
  parserFactory: import("./types").ParserFactory
): Promise<IngestionResult<TRow>> {
  controller.start();

  const collector = new OutputCollector<TRow>(
    options.collectResults,
    options.maxCollectedRows,
  );

  const progressTracker = new ProgressTracker(options.onProgress, options.file);
  progressTracker.setPhase("initializing");

  try {
    const parser = parserFactory(options.file, {
      worker: options.worker,
      chunkSize: options.chunkSize,
      byteChunkSize: options.byteChunkSize,
    });

    // Wire up cancellation propagation to abort the parser immediately
    const cancelListener = () => {
      parser.abort();
      progressTracker.setPhase("cancelled");
    };

    // Check if it was cancelled before we even attached the listener
    if (controller.isCancelled) {
      parser.abort();
      progressTracker.setPhase("cancelled");
    } else {
      controller.onCancel(cancelListener);
    }

    try {
      const chunks = parser.parse();
      const headers = await parser.getHeaders();
      controller.throwIfCancelled();

      const headerResult = resolveHeaders(headers, options.columns);

      if (headerResult.mismatch) {
        progressTracker.setPhase("failed");
        controller.fail();
        return {
          status: controller.getStatus(),
          data: collector.getFinalOutput(),
          error: {
            type: IngestionErrorType.HEADER_MISMATCH,
            message: "File headers do not match the expected schema.",
            details: headerResult.mismatch,
          },
        };
      }

      progressTracker.setPhase("parsing");
      const resolvedColumns = headerResult.columns;
      let chunkIndex = 0;

      for await (const parsedChunk of chunks) {
        await controller.waitIfPaused();
        controller.throwIfCancelled();

        controller.throwIfCancelled();

        const validatedChunk = validateChunk<TRow>(
          parsedChunk.rows,
          parsedChunk.startIndex,
          resolvedColumns,
        );

        controller.throwIfCancelled();

        collector.add(validatedChunk);

        const processedRowsInChunk = validatedChunk.validRows.length + validatedChunk.invalidRows.length;
        progressTracker.updateFromChunk(
          processedRowsInChunk,
          parsedChunk.progress,
          parsedChunk.processedBytes,
          parsedChunk.totalRows
        );

        await options.onChunkProcessed?.({
          chunkIndex: chunkIndex++,
          output: validatedChunk,
          progress: parsedChunk.progress,
          processedRows:
            parsedChunk.startIndex + processedRowsInChunk,
        });

        await cooperativeYield();
      }

      controller.throwIfCancelled();
      progressTracker.setPhase("completed");
      controller.complete();

      return {
        status: controller.getStatus(),
        data: collector.getFinalOutput(),
        error: null,
      };
    } finally {
      // Ensure parser is ALWAYS cleaned up if runIngestion exits early
      // (e.g. error, cancellation, header mismatch, or normal completion)
      parser.abort();
    }
  } catch (error: unknown) {
    if (isIngestionCancelledError(error)) {
      progressTracker.setPhase("cancelled");
      controller.cancel();
      return {
        status: IngestionStatus.Cancelled,
        data: collector.getFinalOutput(),
        error: null,
      };
    }

    progressTracker.setPhase("failed");
    controller.fail();

    if (error && (error as any).code === "COLLECTION_LIMIT_EXCEEDED") {
      return {
        status: controller.getStatus(),
        data: collector.getFinalOutput(),
        error: {
          type: IngestionErrorType.COLLECTION_LIMIT_EXCEEDED,
          message: getErrorMessage(error),
          cause: error,
        },
      };
    }

    return {
      status: controller.getStatus(),
      data: collector.getFinalOutput(),
      error: {
        type: IngestionErrorType.INGESTION_ERROR,
        message: getErrorMessage(error),
        cause: error,
      },
    };
  }
}

export function coreIngest<TRow>(
  options: IngestOptions<TRow>,
  parserFactory: import("./types").ParserFactory
): IngestionInstance<TRow> {
  const controller = new IngestionController();

  const result = runIngestion(controller, options, parserFactory);

  return {
    pause: () => controller.pause(),

    resume: () => controller.resume(),

    cancel: () => controller.cancel(),

    get status() {
      return controller.getStatus();
    },

    result,
  };
}
