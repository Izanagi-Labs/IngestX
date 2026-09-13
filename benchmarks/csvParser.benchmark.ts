import { CSVParser } from "@/src/core/parser/CsvParser";

// Minimal FileReader polyfill to allow PapaParse to read Node's native File objects natively
class PolyfillFileReader {
  public result: string | null = null;
  public error: Error | null = null;
  public onload: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;

  public readAsText(file: File) {
    file
      .text()
      .then((text) => {
        this.result = text;
        if (this.onload) this.onload({ target: this });
      })
      .catch((err) => {
        this.error = err;
        if (this.onerror) this.onerror({ target: this });
      });
  }
}

(global as any).FileReader = PolyfillFileReader;

const formatNumber = (num: number) =>
  new Intl.NumberFormat().format(Math.floor(num));
const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

function generateCsvFile(numRows: number, numCols: number): File {
  const parts: string[] = [];
  const header =
    Array.from({ length: numCols }, (_, i) => `Col${i}`).join(",") + "\n";
  parts.push(header);

  const batchSize = 10000;
  for (let i = 0; i < numRows; i += batchSize) {
    let batch = "";
    const limit = Math.min(numRows, i + batchSize);
    for (let j = i; j < limit; j++) {
      batch +=
        Array.from({ length: numCols }, (_, c) => `val_${j}_${c}`).join(",") +
        "\n";
    }
    parts.push(batch);
  }

  return new File(parts, "benchmark.csv", { type: "text/csv" });
}

interface BenchmarkResult {
  dataset: string;
  chunkSize: number;
  worker: string;
  timeMs: number;
  rowsPerSec: number;
}

async function runBenchmark(
  datasetName: string,
  numRows: number,
  columns: number,
  chunkSize: number,
  worker: boolean,
): Promise<BenchmarkResult | null> {
  if (worker) {
    console.warn(
      `[WARN] Skipping worker=true for ${datasetName} due to Node.js limitation (No Web Workers / URL.createObjectURL).`,
    );
    return null;
  }

  // Generate file in memory
  const file = generateCsvFile(numRows, columns);

  // Force garbage collection before measuring if possible
  if (global.gc) {
    global.gc();
  }

  const parser = new CSVParser(file, worker, chunkSize);
  const generator = parser.parse();

  const startTime = performance.now();
  let count = 0;

  for await (const chunk of generator) {
    count += chunk.rows.length;
  }

  const elapsed = performance.now() - startTime;

  if (count !== numRows) {
    console.error(`ERROR: Expected ${numRows} rows, but got ${count}.`);
  }

  const rowsPerSec = (numRows / elapsed) * 1000;

  return {
    dataset: datasetName,
    chunkSize,
    worker: worker.toString(),
    timeMs: elapsed,
    rowsPerSec,
  };
}

async function main() {
  console.log("Generating CSV Parser Benchmark Data...\n");
  const results: BenchmarkResult[] = [];

  const addResult = async (res: Promise<BenchmarkResult | null>) => {
    const r = await res;
    if (r) results.push(r);
  };

  // 1. Matrix as requested
  await addResult(runBenchmark("100K × 10", 100_000, 10, 10_000, false));
  await addResult(runBenchmark("500K × 10", 500_000, 10, 10_000, false));
  await addResult(runBenchmark("1M × 10", 1_000_000, 10, 10_000, false));

  // NOTE: Depending on Node memory limits (default ~1.5GB to 2GB), these large datasets might crash the script.
  // Running them individually or increasing max-old-space-size may be required if they OOM.
  await addResult(runBenchmark("5M × 10", 5_000_000, 10, 10_000, false));
  await addResult(runBenchmark("10M × 10", 10_000_000, 10, 10_000, false));

  // Wide dataset
  await addResult(runBenchmark("500K × 100", 500_000, 100, 10_000, false));

  // Chunk Size matrix on 1M rows
  await addResult(
    runBenchmark("1M × 10 (Small Chunk)", 1_000_000, 10, 1_000, false),
  );
  await addResult(
    runBenchmark("1M × 10 (Large Chunk)", 1_000_000, 10, 50_000, false),
  );

  // Print results as a markdown table
  console.log("\nCSVParser Benchmark Results\n");
  console.log(
    "Dataset                  | Chunk Size | Worker | Time (ms) | Rows/sec",
  );
  console.log(
    "-------------------------|------------|--------|-----------|------------",
  );

  for (const r of results) {
    const dataset = r.dataset.padEnd(24);
    const chunk = formatNumber(r.chunkSize).padEnd(10);
    const worker = r.worker.padEnd(6);
    const time = formatNumber(r.timeMs).padEnd(9);
    const rps = formatNumber(r.rowsPerSec).padEnd(10);
    console.log(`${dataset} | ${chunk} | ${worker} | ${time} | ${rps}`);
  }
}

main().catch(console.error);
