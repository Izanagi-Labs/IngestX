import * as XLSX from "xlsx";

let sheet: XLSX.WorkSheet | null = null;
let range: XLSX.Range | null = null;
let headers: string[] = [];
let currentOffset = 0;
let chunkSize = 0;
let initialized = false;

self.onmessage = async (event) => {
  const message = event.data;

  try {
    if (message.type === "init") {
      const { file, rowChunkSize: size } = message;
      chunkSize = size;
      currentOffset = 0;

      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      sheet = workbook.Sheets[workbook.SheetNames[0]];

      const rangeStr = sheet["!ref"];
      if (!rangeStr) {
        range = { s: { r: 0, c: 0 }, e: { r: -1, c: 0 } };
      } else {
        range = XLSX.utils.decode_range(rangeStr);
      }

      headers = [];
      if (range.e.r >= range.s.r) {
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
          headers.push(cell !== undefined ? String(cell.v) : `__EMPTY_${c}`);
        }
      }

      currentOffset = range.s.r + 1;
      initialized = true;

      self.postMessage({ type: "ready", headers });
    } else if (message.type === "next") {
      if (!initialized || !sheet || !range) return;

      if (currentOffset > range.e.r) {
        // Explicit cleanup for GC before termination
        sheet = null;
        range = null;
        headers = [];
        initialized = false;

        self.postMessage({
          type: "done",
        });
        return;
      }

      const parsedRows: Record<string, string>[] = [];
      const startIndex = currentOffset - (range.s.r + 1);

      for (
        let i = 0;
        i < chunkSize && currentOffset <= range.e.r;
        currentOffset++
      ) {
        let hasValue = false;
        const rowObj: Record<string, string> = {};
        for (let c = range.s.c; c <= range.e.c; c++) {
          const cell = sheet[XLSX.utils.encode_cell({ r: currentOffset, c })];
          const val = cell !== undefined ? String(cell.w || cell.v) : "";
          if (val !== "") hasValue = true;
          rowObj[headers[c - range.s.c]] = val;
        }

        if (hasValue) {
          parsedRows.push(rowObj);
          i++; // only increment chunk counter if row was not empty
        }
      }

      const totalRows = Math.max(1, range.e.r - range.s.r);
      const progress = Math.min(
        1,
        (currentOffset - (range.s.r + 1)) / totalRows,
      );

      self.postMessage({
        type: "chunk",
        payload: {
          headers,
          rows: parsedRows,
          startIndex,
          progress,
          totalRows,
        },
      });
    }
  } catch (error) {
    self.postMessage({
      type: "error",
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
