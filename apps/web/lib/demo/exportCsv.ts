import Papa from "papaparse";
import { DemoResult } from "../../store/demoStore";

export function downloadValidCsv(result: DemoResult, filename: string = "valid_rows.csv") {
  if (!result || !result.validRows.length) return;

  const data = result.validRows.map(row => {
    const copy = { ...row };
    delete copy._ixRowIndex;
    return copy;
  });

  const csv = Papa.unparse(data);
  downloadStringAsFile(csv, filename);
}

export function downloadInvalidCsv(result: DemoResult, filename: string = "invalid_rows.csv") {
  if (!result || !result.invalidRows.length) return;

  const data = result.invalidRows.map(row => {
    // Format errors into a string for the __errors column
    const errorMessages = Object.entries(row.errors)
      .map(([col, errs]) => {
        const errorsList = errs as { message: string }[];
        return `${col}: ${errorsList.map(e => e.message).join(", ")}`;
      })
      .join(" | ");

    return {
      ...row.data,
      __errors: errorMessages,
    };
  });

  const csv = Papa.unparse(data);
  downloadStringAsFile(csv, filename);
}

function downloadStringAsFile(data: string, filename: string) {
  const blob = new Blob([data], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  
  link.click();
  
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
