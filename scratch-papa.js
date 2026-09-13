const Papa = require("papaparse");
const fs = require("fs");

// Create a large CSV file to test chunks and pause/resume
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
  chunkSize: 100, // force small chunks
  chunk: (results, parser) => {
    chunkCount++;
    parsedRows += results.data.length;
    console.log(`Chunk ${chunkCount}: received ${results.data.length} rows`);
    
    // Test pause and resume
    parser.pause();
    console.log(`Parser paused at chunk ${chunkCount}`);
    
    setTimeout(() => {
      console.log(`Resuming parser at chunk ${chunkCount}`);
      
      if (chunkCount === 3) {
        console.log("Aborting at chunk 3");
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
