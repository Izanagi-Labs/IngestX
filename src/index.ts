import { coreIngest } from "./core/ingest";
import { createParser } from "./core/parser";
import type { IngestOptions, IngestionInstance } from "./core/ingest/types";

export function ingest<TRow>(
  options: IngestOptions<TRow>
): IngestionInstance<TRow> {
  return coreIngest(options, createParser);
}

export type { IngestionInstance, IngestOptions, Progress, ProgressBasis } from "./core/ingest/types";
export type { ColumnConfig } from "./model";
export { ix } from "./model/ix";
export { IngestionStatus } from "./core/controller/types";
export { IngestionErrorType } from "./core/ingest/types";
