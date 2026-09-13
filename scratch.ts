import * as XLSX from "xlsx";

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet([
  { name: "Eve", age: 22 },
  { name: "Dave", age: 33 },
]);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, {
  header: 1,
  raw: false,
  blankrows: false,
});

console.log(JSON.stringify(rawRows, null, 2));
