import * as XLSX from "xlsx";

try {
  const wb = XLSX.read(new ArrayBuffer(0), { type: "array" });
  console.log("Success! Sheets:", wb.SheetNames);
} catch (e) {
  console.log("Error:", e.message);
}
