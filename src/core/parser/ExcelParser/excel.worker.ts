import * as XLSX from "xlsx";

self.onmessage = async (event) => {
  const { file, chunkSize } = event.data;

  try {
    const buffer = await file.arrayBuffer();

    const workbook = XLSX.read(buffer, {
      type: "array",
    });

    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
      defval: "",
    });

    const headers = rows.length ? Object.keys(rows[0]) : [];

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

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
          startIndex: i,
        },
      });
    }

    self.postMessage({
      type: "done",
    });
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
