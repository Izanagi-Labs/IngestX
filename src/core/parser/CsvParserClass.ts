import Papa from 'papaparse';
import { Parser } from './types';

export class CSVParser implements Parser {
  constructor(
    private readonly file: File,
    private readonly worker = false,
  ) {}

  parse(): Promise<Record<string, string>[]> {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, string>>(this.file, {
        header: true,
        skipEmptyLines: true,
        worker: this.worker,

        complete: ({ data }) => {
          resolve(data);
        },

        error: reject,
      });
    });
  }
}
