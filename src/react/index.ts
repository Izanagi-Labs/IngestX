import { useState, useRef, useCallback } from 'react';
import {
  ColumnConfig,
  FinalOutput,
  IngestionController,
  IngestionOptions,
  ErrorsData,
} from '../types';
import { processRowsInChunks } from '../core/processRowsInChunks';
import { normalizeHeaders } from '../core/normalizeHeaders';
import { parseCsvToRows, parseExcelToRows } from '../core/parser';

type UseIngestionOptions = {
  columnConfigs: ColumnConfig[];
  chunkSize?: number;
  options?: IngestionOptions;
};

export function useIngestion({
  columnConfigs,
  chunkSize = 500,
  options,
}: UseIngestionOptions) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<FinalOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use ref for controller to avoid re-renders interrupting the loop
  const controllerRef = useRef<IngestionController>({
    isPaused: false,
    isCancelled: false,
  });

  const pause = useCallback(() => {
    controllerRef.current.isPaused = true;
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    controllerRef.current.isPaused = false;
    setIsPaused(false);
  }, []);

  const cancel = useCallback(() => {
    controllerRef.current.isCancelled = true;
    setIsProcessing(false);
    setIsPaused(false);
  }, []);

  const startIngestion = useCallback(
    async (file: File) => {
      // Reset state
      setIsProcessing(true);
      setIsPaused(false);
      setProgress(0);
      setError(null);
      controllerRef.current = { isPaused: false, isCancelled: false };

      if (!file) {
        setIsProcessing(false);
        setError('No file provided.');
        return;
      }

      let parsedRows: Record<string, any>[] = [];
      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        if (fileExtension === 'csv') {
          parsedRows = await parseCsvToRows(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          const buffer = await file.arrayBuffer();
          parsedRows = await parseExcelToRows(buffer);
        } else {
          setIsProcessing(false);
          setError(
            'Unsupported file format. Please upload a CSV or Excel file.',
          );
          return;
        }
      } catch (err: any) {
        setIsProcessing(false);
        setError('Error parsing file: ' + err.message);
        return;
      }

      if (parsedRows.length === 0) {
        setIsProcessing(false);
        setError('No rows provided for processing.');
        return;
      }

      // Validate Headers
      const sentHeaders = Object.keys(parsedRows[0]);
      const { normalizedRows, headersMismatch } = normalizeHeaders(
        sentHeaders,
        columnConfigs,
        options,
      );

      if (headersMismatch) {
        setError('Headers mismatch');
        setIsProcessing(false);
        // Could return headersMismatch here via state if needed by UI
        return { headersMismatch } as { headersMismatch: any };
      }

      const rowsToProcess = normalizedRows
        ? normalizedRows(parsedRows)
        : parsedRows;
      const totalRows = rowsToProcess.length;
      let processedCount = 0;
      let cumulativeValidCount = 0;
      let cumulativeInvalidCount = 0;

      let cumulativeValidRows: Record<string, any>[] = [];
      let cumulativeInvalidRows: Record<string, any>[] = [];
      let cumulativeErrorsData: ErrorsData = { rowWiseErrors: [] };

      const shouldAccumulateResult = options?.shouldAccumulateResult !== false;

      const handleChunkProcessed = async (chunkResult: FinalOutput) => {
        cumulativeValidCount += chunkResult.validRows.length;
        cumulativeInvalidCount += chunkResult.invalidRows.length;
        processedCount +=
          chunkResult.validRows.length + chunkResult.invalidRows.length;

        if (shouldAccumulateResult) {
          cumulativeValidRows = [
            ...cumulativeValidRows,
            ...chunkResult.validRows,
          ];
        }
        if (shouldAccumulateResult) {
          cumulativeInvalidRows = [
            ...cumulativeInvalidRows,
            ...chunkResult.invalidRows,
          ];
          cumulativeErrorsData = {
            ...chunkResult.errorsData,
            rowWiseErrors: [
              ...cumulativeErrorsData.rowWiseErrors,
              ...chunkResult.errorsData.rowWiseErrors,
            ],
          };
        }

        const currentProgress = Math.round((processedCount / totalRows) * 100);
        setProgress(currentProgress);

        setResult({
          totalRows,
          validRowsCount: cumulativeValidCount,
          invalidRowsCount: cumulativeInvalidCount,
          validRows: shouldAccumulateResult
            ? cumulativeValidRows
            : chunkResult.validRows,
          invalidRows: shouldAccumulateResult
            ? cumulativeInvalidRows
            : chunkResult.invalidRows,
          errorsData: shouldAccumulateResult
            ? cumulativeErrorsData
            : chunkResult.errorsData,
        });

        // Let the event loop breathe to allow React renders
        await new Promise((resolve) => setTimeout(resolve, 0));
      };

      try {
        const output = await processRowsInChunks({
          rows: rowsToProcess,
          columnConfigs,
          chunkSize,
          onChunkProcessed: handleChunkProcessed,
          ingestionController: controllerRef.current,
          options,
        });

        if (!controllerRef.current.isCancelled && shouldAccumulateResult) {
          setResult(output);
        }
        if (!controllerRef.current.isCancelled) {
          setIsProcessing(false);
        }
      } catch (err: any) {
        setError(
          err.message || 'An error occurred during ingestion processing.',
        );
        setIsProcessing(false);
      }
    },
    [columnConfigs, chunkSize, options],
  );

  return {
    startIngestion,
    pause,
    resume,
    cancel,
    isProcessing,
    isPaused,
    progress,
    result,
    error,
  };
}
