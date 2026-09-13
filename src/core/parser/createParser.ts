import { CSVParser } from "./CsvParser";
import { ExcelParser } from "./ExcelParser";
import { Parser } from "./types";
import { IngestOptions } from "../ingest/types";

export function createParser(
  file: File,
  options?: Pick<IngestOptions<any>, "worker" | "chunkSize" | "byteChunkSize">,
): Parser {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return new CSVParser(
        file,
        options?.worker,
        options?.chunkSize,
        options?.byteChunkSize,
      );

    case "xlsx":
    case "xls":
      return new ExcelParser(file, options?.chunkSize);

    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
