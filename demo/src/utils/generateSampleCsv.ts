import type { ColumnConfig } from "@parallelbytes/ingestx";

export function generateSampleCsv(columns: ColumnConfig[]): string {
  const headers = columns.map((c) => c.displayNames[0] || c.key);
  const rows: string[][] = [];

  const generateValidValue = (col: ColumnConfig, index: number): string => {
    if (col.type === "number") {
      if (col.allowedValues && col.allowedValues.length > 0) {
        return String(col.allowedValues[index % col.allowedValues.length]);
      }
      let val = (index + 1) * 10;
      if (col.min !== undefined && val < col.min) val = col.min + 1;
      if (col.max !== undefined && val > col.max) val = col.max - 1;
      return String(val);
    }
    if (col.type === "boolean") {
      if (col.trueValues && col.trueValues.length > 0) {
        return col.trueValues[0];
      }
      return index % 2 === 0 ? "true" : "false";
    }
    // String
    if (col.allowedValues && col.allowedValues.length > 0) {
      return String(col.allowedValues[index % col.allowedValues.length]);
    }
    // Fallback for regex: just generic string
    return `Value_${index}`;
  };

  // 1. Generate 10 Valid Rows
  for (let i = 0; i < 10; i++) {
    rows.push(columns.map((col) => generateValidValue(col, i)));
  }

  // 2. Generate 10 Invalid Rows
  // We'll map different error scenarios to the rows
  for (let i = 10; i < 20; i++) {
    const row = columns.map((col) => generateValidValue(col, i));
    const errorCase = i - 10; // 0 to 9

    // Try to find a suitable column for the error case, or default to the first one
    if (errorCase === 0) {
      // Missing required value
      const reqColIdx = columns.findIndex((c) => c.validationRequired);
      if (reqColIdx !== -1) row[reqColIdx] = "";
      else row[0] = ""; // If no required, just empty first
    } else if (errorCase === 1) {
      // Invalid number type
      const numColIdx = columns.findIndex((c) => c.type === "number");
      if (numColIdx !== -1) row[numColIdx] = "not_a_number_string";
      else row[0] = "!!!INVALID!!!";
    } else if (errorCase === 2) {
      // Under minimum
      const minColIdx = columns.findIndex(
        (c) => c.type === "number" && c.min !== undefined,
      );
      if (minColIdx !== -1) {
        const col = columns[minColIdx];
        if (col.type === "number") {
          row[minColIdx] = String(col.min! - 100);
        }
      } else row[0] = "!!!INVALID!!!";
    } else if (errorCase === 3) {
      // Over maximum
      const maxColIdx = columns.findIndex(
        (c) => c.type === "number" && c.max !== undefined,
      );
      if (maxColIdx !== -1) {
        const col = columns[maxColIdx];
        if (col.type === "number") {
          row[maxColIdx] = String(col.max! + 100);
        }
      } else row[0] = "!!!INVALID!!!";
    } else if (errorCase === 4) {
      // Invalid enum (not in allowedValues)
      const enumColIdx = columns.findIndex(
        (c) =>
          c.type === "string" && c.allowedValues && c.allowedValues.length > 0,
      );
      if (enumColIdx !== -1) row[enumColIdx] = "UNAUTHORIZED_VALUE";
      else row[0] = "!!!INVALID!!!";
    } else if (errorCase === 5) {
      // Invalid boolean type
      const boolColIdx = columns.findIndex((c) => c.type === "boolean");
      if (boolColIdx !== -1) row[boolColIdx] = "maybe_true";
      else row[0] = "!!!INVALID!!!";
    } else if (errorCase === 6) {
      // Duplicate value (if duplicates not allowed)
      const uniqueColIdx = columns.findIndex(
        (c) => c.isDuplicatesAllowed === false,
      );
      if (uniqueColIdx !== -1)
        row[uniqueColIdx] = rows[0][uniqueColIdx]; // Copy from row 0
      else row[0] = rows[0][0]; // Just cause duplicate anyway to test
    } else {
      // Catch-all: just corrupt the value with something obviously wrong
      const colIdx = errorCase % columns.length;
      if (columns[colIdx].validationRequired) {
        row[colIdx] = "";
      } else {
        row[colIdx] = "ERROR_INJECTED_" + errorCase;
      }
    }

    rows.push(row);
  }

  // Convert to CSV string safely
  const escapeCsv = (val: string) => {
    const escaped = val.replace(/"/g, '""');
    return `"${escaped}"`;
  };

  const csvLines = [
    headers.map(escapeCsv).join(","),
    ...rows.map((r) => r.map(escapeCsv).join(",")),
  ];

  return csvLines.join("\n");
}

export function downloadBlobAsCsv(csvContent: string, filename: string) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
