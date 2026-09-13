import * as XLSX from "xlsx";

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([
  ["a", "b", "c"],
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
]);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const rangeStr = ws["!ref"];
if (!rangeStr) {
  console.log("Empty sheet");
  process.exit(0);
}

const range = XLSX.utils.decode_range(rangeStr);
const headers = [];
for (let c = range.s.c; c <= range.e.c; c++) {
  const cell = ws[XLSX.utils.encode_cell({ r: range.s.r, c })];
  headers.push(cell !== undefined ? String(cell.v) : `__EMPTY_${c}`);
}

console.log("Headers:", headers);

let currentOffset = range.s.r + 1;
const chunkSize = 2;

while (currentOffset <= range.e.r) {
  const chunk = [];
  for (
    let i = 0;
    i < chunkSize && currentOffset <= range.e.r;
    i++, currentOffset++
  ) {
    let hasValue = false;
    const rowObj = {};
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = ws[XLSX.utils.encode_cell({ r: currentOffset, c })];
      const val = cell !== undefined ? String(cell.w || cell.v) : "";
      if (val !== "") hasValue = true;
      rowObj[headers[c - range.s.c]] = val;
    }
    if (hasValue) {
      chunk.push(rowObj);
    }
  }
  console.log("Chunk:", chunk);
}
