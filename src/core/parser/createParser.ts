import { CSVParser } from './CsvParser';
import { ExcelParser } from './ExcelParser';

export function createParser(file: File, worker?: boolean) {
  const extension = file.name.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'csv':
      return new CSVParser(file, worker).parse();

    case 'xlsx':
    case 'xls':
      return new ExcelParser(file).parse();

    default:
      throw new Error(`Unsupported file type: ${extension}`);
  }
}
