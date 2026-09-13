import Papa from "papaparse";
import fs from "fs";

const lines = ["a,b"];
for (let i = 0; i < 50; i++) {
  lines.push(`${i},${i*2}`);
}
fs.writeFileSync("test.csv", lines.join("\n"));

const stream = fs.createReadStream("test.csv");

let chunkCount = 0;
let parsedRows = 0;

Papa.parse(stream, {
  header: true,
  chunkSize: 10,
  chunk: (results, parser) => {
    chunkCount++;
    parsedRows += results.data.length;
    console.log(`Chunk ${chunkCount}: received ${results.data.length} rows`);
    parser.pause();
    setTimeout(() => {
      if (chunkCount === 1) {
        console.log("Aborting!");
        parser.abort();
      } else {
        parser.resume();
      }
    }, 50);
  },
  complete: () => {
    console.log(`Complete! Total chunks: ${chunkCount}, Total rows: ${parsedRows}`);
  },
  error: (err) => {
    console.error("Error:", err);
  }
});
