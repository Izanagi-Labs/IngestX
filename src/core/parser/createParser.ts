import { CSVParser } from "./CsvParser";
import { ExcelParser } from "./ExcelParser";
import { Parser } from "./types";

export function createParser(file: File, worker?: boolean): Parser {
  const extension = file.name.split(".").pop()?.toLowerCase();

  switch (extension) {
    case "csv":
      return new CSVParser(file, worker);

    case "xlsx":
    case "xls":
      return new ExcelParser(file);

    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
