import * as XLSX from 'xlsx';

export async function parseExcelToRows(excelBuffer: ArrayBuffer | Uint8Array | Buffer | string): Promise<Record<string, string>[]> {
  try {
    const workbook = XLSX.read(excelBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    // return as array of objects, treating all headers as string and values as string where possible or letting user handle
    const data = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, { defval: "" });
    
    // Ensure all values are strings
    const stringifiedData = data.map(row => {
      const newRow: Record<string, string> = {};
      for (const key in row) {
        newRow[key] = String(row[key]);
      }
      return newRow;
    });
    
    return stringifiedData;
  } catch (error) {
    return Promise.reject(error);
  }
}
