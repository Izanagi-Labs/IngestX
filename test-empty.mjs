import * as XLSX from "xlsx";

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.aoa_to_sheet([["a", "b", "c"], [1, 2, 3], [], [4, 5, 6]]);
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

const rows1 = XLSX.utils.sheet_to_json(ws);
const rows2 = XLSX.utils.sheet_to_json(ws, { defval: "" });
const rows3 = XLSX.utils.sheet_to_json(ws, { defval: "", blankrows: false });
const rows4 = XLSX.utils.sheet_to_json(ws, { defval: "", blankrows: true });

console.log("default:");
console.log(rows1);
console.log("defval: ''");
console.log(rows2);
console.log("defval: '', blankrows: false");
console.log(rows3);
console.log("defval: '', blankrows: true");
console.log(rows4);
