import Papa from 'papaparse';

export async function parseCsvToRows(csvContent: string | File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent as any, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data as Record<string, string>[]);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}
