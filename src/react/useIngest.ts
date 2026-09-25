import { useCallback, useEffect, useRef, useState } from "react";
import { ingest, IngestionStatus } from "../index";
import type {
  HeaderMismatchError,
  IngestionError,
  IngestionInstance,
  IngestionResult,
  IngestOptions,
  Progress,
  FinalOutput,
} from "../core/ingest/types";
import { IngestionErrorType } from "../core/ingest/types";

export type UseIngestOptions<TRow> = Omit<IngestOptions<TRow>, "onProgress">;

interface ActiveRun<TRow> {
  instance: IngestionInstance<TRow>;
  id: number;
}

export function useIngest<TRow = Record<string, unknown>>() {
  const [status, setStatus] = useState<IngestionStatus>(IngestionStatus.Idle);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [result, setResult] = useState<FinalOutput<TRow> | null>(null);
  const [error, setError] = useState<
    IngestionError | HeaderMismatchError | null
  >(null);

  const activeRunRef = useRef<ActiveRun<TRow> | null>(null);
  const nextRunIdRef = useRef(1);

  useEffect(() => {
    return () => {
      const activeRun = activeRunRef.current;

      if (!activeRun) {
        return;
      }

      if (
        activeRun.instance.status === IngestionStatus.Running ||
        activeRun.instance.status === IngestionStatus.Paused
      ) {
        activeRun.instance.cancel();
      }
    };
  }, []);

  const startIngest = useCallback(
    async (options: UseIngestOptions<TRow>): Promise<void> => {
      const activeRun = activeRunRef.current;

      if (
        activeRun &&
        (activeRun.instance.status === IngestionStatus.Running ||
          activeRun.instance.status === IngestionStatus.Paused)
      ) {
        throw new Error("An ingestion is already in progress");
      }

      const runId = nextRunIdRef.current++;

      setStatus(IngestionStatus.Running);
      setProgress(null);
      setResult(null);
      setError(null);

      const instance = ingest({
        ...options,
        onProgress: (nextProgress) => {
          if (activeRunRef.current?.id !== runId) {
            return;
          }

          setProgress(nextProgress);
        },
      });

      activeRunRef.current = {
        instance,
        id: runId,
      };

      try {
        const ingestionResult: IngestionResult<TRow> = await instance.result;

        if (activeRunRef.current?.id !== runId) {
          return;
        }

        setStatus(ingestionResult.status);
        setResult(ingestionResult.data);
        setError(ingestionResult.error);
      } catch (err) {
        if (activeRunRef.current?.id !== runId) {
          return;
        }

        /*
         * The core contract should normally guarantee that
         * instance.result resolves with an IngestionResult.
         *
         * This catch exists only as a defensive boundary.
         */
        setStatus(IngestionStatus.Failed);

        setError({
          type: IngestionErrorType.INGESTION_ERROR,
          message:
            err instanceof Error ? err.message : "Unexpected ingestion failure",
          cause: err,
        });
      } finally {
        if (activeRunRef.current?.id === runId) {
          activeRunRef.current = null;
        }
      }
    },
    [],
  );

  const pause = useCallback(() => {
    const activeRun = activeRunRef.current;

    if (!activeRun) {
      return;
    }

    if (activeRun.instance.status === IngestionStatus.Running) {
      activeRun.instance.pause();
      setStatus(activeRun.instance.status);
    }
  }, []);

  const resume = useCallback(() => {
    const activeRun = activeRunRef.current;

    if (!activeRun) {
      return;
    }

    if (activeRun.instance.status === IngestionStatus.Paused) {
      activeRun.instance.resume();
      setStatus(activeRun.instance.status);
    }
  }, []);

  const cancel = useCallback(() => {
    const activeRun = activeRunRef.current;

    if (!activeRun) {
      return;
    }

    if (
      activeRun.instance.status !== IngestionStatus.Running &&
      activeRun.instance.status !== IngestionStatus.Paused
    ) {
      return;
    }

    activeRun.instance.cancel();

    /*
     * Don't clear activeRunRef here.
     * Let instance.result resolve and the async lifecycle
     * clean it up in finally.
     */
  }, []);

  const reset = useCallback(() => {
    const activeRun = activeRunRef.current;

    if (
      activeRun &&
      (activeRun.instance.status === IngestionStatus.Running ||
        activeRun.instance.status === IngestionStatus.Paused)
    ) {
      activeRun.instance.cancel();
    }

    // Detach the active run completely.
    // The previous promise will still resolve/reject, but `id !== runId` checks
    // will safely ignore those updates.
    activeRunRef.current = null;
    setStatus(IngestionStatus.Idle);
    setProgress(null);
    setResult(null);
    setError(null);
  }, []);

  return {
    ingest: startIngest,
    pause,
    resume,
    cancel,
    reset,
    status,
    progress,
    result,
    error,
  };
}
