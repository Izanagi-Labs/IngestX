import * as XLSX from "xlsx";

let rows: Record<string, unknown>[] = [];
let headers: string[] = [];
let currentOffset = 0;
let chunkSize = 0;
let initialized = false;

self.onmessage = async (event) => {
  const message = event.data;

  try {
    if (message.type === "init") {
      const { file, chunkSize: size } = message;
      chunkSize = size;
      currentOffset = 0;

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      headers = rows.length ? Object.keys(rows[0]) : [];
      initialized = true;

      self.postMessage({ type: "ready" });
    } else if (message.type === "next") {
      if (!initialized) return;

      if (currentOffset >= rows.length) {
        self.postMessage({
          type: "done",
        });
        return;
      }

      const chunk = rows.slice(currentOffset, currentOffset + chunkSize);

      const parsedRows = chunk.map((row) => {
        const result: Record<string, string> = {};

        for (const key in row) {
          result[key] = String(row[key]);
        }

        return result;
      });

      self.postMessage({
        type: "chunk",
        payload: {
          headers,
          rows: parsedRows,
          startIndex: currentOffset,
        },
      });

      currentOffset += chunkSize;
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
