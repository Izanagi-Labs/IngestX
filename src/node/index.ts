import { coreIngest } from "../core/ingest";
import { nodeParserFactory } from "./parser/nodeParserFactory";
import type { IngestionInstance, IngestOptions } from "../core/ingest/types";
import fs from "fs";
import path from "path";

export type NodeIngestOptions<TRow> = Omit<IngestOptions<TRow>, "file" | "worker"> & {
  filePath: string;
};

export function ingest<TRow>(
  options: NodeIngestOptions<TRow>
): IngestionInstance<TRow> {
  if (!options.filePath) {
    throw new Error("filePath is required");
  }
  
  const absolutePath = path.resolve(options.filePath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${options.filePath}`);
  }

  // We must map NodeIngestOptions to the core IngestOptions
  // Since core expects a File object (which we don't have in Node),
  // and the parser factory expects a string in our Node implementation,
  // we use a slight cast to satisfy the core pipeline options, which
  // internally only passes it to our nodeParserFactory.
  const stat = fs.statSync(absolutePath);
  const coreOptions: IngestOptions<TRow> = {
    ...options,
    file: { 
      name: path.basename(absolutePath),
      size: stat.size,
      type: "" 
    } as unknown as File, 
  };

  return coreIngest(
    coreOptions, 
    // We pass the absolutePath string directly to our nodeParserFactory,
    // ignoring what coreOptions.file technically is, because nodeParserFactory
    // explicitly expects a string.
    () => nodeParserFactory(absolutePath, {
      chunkSize: options.chunkSize,
      byteChunkSize: options.byteChunkSize,
      worker: false
    }) as any
  );
}

export type { IngestionInstance, Progress, ProgressBasis } from "../core/ingest/types";
export type { ColumnConfig } from "../model";
export { ix } from "../model/ix";
export { IngestionStatus } from "../core/controller/types";
export { IngestionErrorType } from "../core/ingest/types";
