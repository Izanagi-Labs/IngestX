import { Parser } from "../../core/parser/types";
import { ParserOptions } from "../../core/ingest/types";
import { NodeCsvParser } from "./NodeCsvParser";
import { NodeExcelParser } from "./NodeExcelParser";

export function nodeParserFactory(
  filePath: string,
  options?: ParserOptions
): Parser {
  const extension = filePath.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return new NodeCsvParser(
        filePath,
        options?.chunkSize,
        options?.byteChunkSize
      );

    case "xlsx":
    case "xls":
      return new NodeExcelParser(
        filePath,
        options?.chunkSize
      );

    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
