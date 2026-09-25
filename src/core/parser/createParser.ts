import { CSVParser } from "./CsvParser";
import { ExcelParser } from "./ExcelParser";
import { Parser } from "./types";
import { IngestOptions } from "../ingest/types";

export function createParser(
  file: File,
  options?: Pick<
    IngestOptions<unknown>,
    "worker" | "chunkSize" | "byteChunkSize"
  >,
): Parser {
  const fileName = file && typeof file.name === "string" ? file.name : "";
  const extension = fileName.split(".").pop()?.toLowerCase();

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
