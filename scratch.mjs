import Papa from "papaparse";
Papa.parse("", {
  header: true,
  chunk: (results) => console.log("chunk", results),
  complete: () => console.log("complete"),
  error: (err) => console.log("error", err)
});
