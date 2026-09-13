import * as XLSX from "xlsx";

class PolyfillFileReader {
  public result: string | null = null;
  public error: Error | null = null;
  public onload: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;

  public readAsText(file: File) {
    file
      .text()
      .then((text) => {
        this.result = text;
        if (this.onload) this.onload({ target: this });
      })
      .catch((err) => {
        this.error = err;
        if (this.onerror) this.onerror({ target: this });
      });
  }
}

if (typeof global !== "undefined" && !(global as any).FileReader) {
  (global as any).FileReader = PolyfillFileReader;
}
if (typeof globalThis !== "undefined" && !(globalThis as any).FileReader) {
  (globalThis as any).FileReader = PolyfillFileReader;
}

export function generateCSV(headers: string[], rows: any[][], filename = "test.csv"): File {
  const content = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
  return new File([content], filename, { type: "text/csv" });
}

export function generateExcel(headers: string[], rows: any[][], filename = "test.xlsx"): File {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new File([buffer], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function generateEmptyCSV(): File {
  return new File([], "empty.csv", { type: "text/csv" });
}

export function generateEmptyExcel(): File {
  return new File([], "empty.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

export function generateHeadersOnlyCSV(headers: string[]): File {
  return new File([headers.join(",")], "headers.csv", { type: "text/csv" });
}

export function generateHeadersOnlyExcel(headers: string[]): File {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });
  return new File([buffer], "headers.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
