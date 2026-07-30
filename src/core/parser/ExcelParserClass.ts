import * as XLSX from 'xlsx';
import { Parser } from './types';

export class ExcelParser implements Parser {
  constructor(private readonly file: File) {}

  async parse(): Promise<Record<string, string>[]> {
    const buffer = await this.file.arrayBuffer();

    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: '',
    });

    const stringifiedRows = rows.map((row) => {
      const parsedRow: Record<string, string> = {};

      for (const key in row) {
        parsedRow[key] = String(row[key]);
      }

      return parsedRow;
    });

    return stringifiedRows;
  }
}
