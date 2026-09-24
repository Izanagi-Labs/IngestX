import { useDemoStore } from "../../store/demoStore";
import { ingest, IngestionInstance } from "@parallelbytes/ingestx";
import { compilePlaygroundSchema, PlaygroundSchemaError } from "./schema/compiler";

let activeInstance: IngestionInstance<any> | null = null;
let activeRunId = 0;

export async function runIngestion() {
  const store = useDemoStore.getState();
  if (!store.file) return;

  activeRunId++;
  const runId = activeRunId;

  // Clear previous state
  store.setStatus("running");
  store.setProgress({ processed: 0, valid: 0, invalid: 0, progressPercentage: 0 });
  store.setResult(null);
  store.setError(null);

  let columns;
  try {
    columns = compilePlaygroundSchema(store.schemaCode);
  } catch (err: any) {
    if (runId !== activeRunId) return;
    store.setError(err.message);
    return;
  }

  activeInstance = ingest({
    file: store.file,
    columns,
    chunkSize: store.configuration.rowChunkSize,
    byteChunkSize: store.configuration.byteChunkSize,
    collectResults: store.configuration.collectResults,
    maxCollectedRows: store.configuration.maxCollectedRows,
    onProgress: (p) => {
      if (runId !== activeRunId) return;
      useDemoStore.getState().setProgress({
        progressPercentage: p.percentage || 0,
        processed: p.processedRows,
      });
    },
  });

  try {
    const result = await activeInstance.result;
    
    if (runId !== activeRunId) return;

    if (result.status === "completed") {
      store.setStatus("completed");
      
      const { data } = result;
      // Real IngestX returns FinalOutput which includes totalRows, validRowsCount, invalidRowsCount
      // validRows array, invalidRows array, and errorsData.
      
      store.setProgress({
        progressPercentage: 100,
        processed: data.totalRows,
        valid: data.validRowsCount,
        invalid: data.invalidRowsCount,
      });

      // Map `data.invalidRows` and `data.errorsData.rowWiseErrors` into a structure
      // that ResultsPanel can render. The invalidRows array matches the unique rowIndices
      // in rowWiseErrors in the exact same order.
      const uniqueErrorIndices = Array.from(new Set(data.errorsData.rowWiseErrors.map(e => e.rowIndex)));
      
      const mappedInvalidRows = data.invalidRows.map((row: any, i) => {
        const rowIndex = uniqueErrorIndices[i] ?? i;
        
        const rowErrors = data.errorsData.rowWiseErrors.filter(e => e.rowIndex === rowIndex);
        const groupedErrors: Record<string, { message: string }[]> = {};
        
        for (const re of rowErrors) {
          if (!groupedErrors[re.columnKey]) groupedErrors[re.columnKey] = [];
          groupedErrors[re.columnKey].push({ message: re.errorMessage });
        }
        
        return {
          _ixRowIndex: rowIndex,
          data: row,
          errors: groupedErrors,
        };
      });

      store.setResult({
        validRows: data.validRows,
        invalidRows: mappedInvalidRows,
        columns: columns.map(c => ({ key: c.key, name: c.name })),
      });
    } else if (result.status === "cancelled") {
      store.setStatus("ready");
    } else if (result.status === "failed") {
      let errorMessage = result.error?.message || "Ingestion failed";
      
      if (result.error && "type" in result.error && result.error.type === "HEADER_MISMATCH") {
        const mismatch = (result.error as any).details;
        if (mismatch) {
          errorMessage = "Header Mismatch:\n";
          if (mismatch.missing?.length) {
            errorMessage += `\nMissing:\n- ${mismatch.missing.join("\n- ")}`;
          }
          if (mismatch.unexpected?.length) {
            errorMessage += `\n\nUnexpected:\n- ${mismatch.unexpected.join("\n- ")}`;
          }
        }
      }
      
      store.setError(errorMessage);
    }
  } catch (err: any) {
    if (runId !== activeRunId) return;
    store.setError(err.message || "Unknown error occurred");
  } finally {
    if (runId === activeRunId) {
      activeInstance = null;
    }
  }
}

export function pauseIngestion() {
  const store = useDemoStore.getState();
  if (store.status === "running" && activeInstance) {
    activeInstance.pause();
    store.setStatus("paused");
  }
}

export function resumeIngestion() {
  const store = useDemoStore.getState();
  if (store.status === "paused" && activeInstance) {
    activeInstance.resume();
    store.setStatus("running");
  }
}

export function cancelIngestion() {
  if (activeInstance) {
    activeInstance.cancel();
    activeInstance = null;
  }
  
  activeRunId++; // invalidate any settling promises
  
  const store = useDemoStore.getState();
  store.setStatus("ready"); // revert back to ready
  store.setProgress({ processed: 0, valid: 0, invalid: 0, progressPercentage: 0 });
}
