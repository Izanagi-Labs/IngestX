import { ExcelParser } from "../src/core/parser/ExcelParser";
import { RowsAndHeaders } from "../src/core/parser";

// A barebones mock worker that doesn't depend on Vitest/JSDOM
class BenchmarkMockWorker {
  public onmessage: ((ev: any) => any) | null = null;
  public onmessageerror: ((ev: any) => any) | null = null;
  public onerror: ((ev: any) => any) | null = null;

  public terminate() {}
  public postMessage() {}
  public addEventListener() {}
  public removeEventListener() {}
  public dispatchEvent() {
    return true;
  }

  // Simulates worker posting message back to main thread
  public send(data: any) {
    if (this.onmessage) {
      this.onmessage({ data });
    }
  }
}

let activeWorker: BenchmarkMockWorker | null = null;
(globalThis as any).Worker = class {
  constructor() {
    activeWorker = new BenchmarkMockWorker();
    return activeWorker;
  }
};

const formatNumber = (num: number) =>
  new Intl.NumberFormat().format(Math.floor(num));
const formatBytes = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function runBenchmark(
  name: string,
  numRows: number,
  columns: number,
  chunkSize: number,
) {
  console.log(`Benchmark\n--------------------------------`);
  console.log(`${name}`);
  console.log(`Rows:\n${formatNumber(numRows)}\n`);

  const numChunks = Math.ceil(numRows / chunkSize);
  console.log(`Chunks:\n${formatNumber(numChunks)}\n`);

  // Lazily generate row objects only just before dispatch to avoid massive pre-allocation OOMs
  const generateChunk = (startIndex: number): RowsAndHeaders => {
    const headers = Array.from({ length: columns }).map((_, i) => `Col${i}`);
    const rows = Array.from({ length: chunkSize }).map((_, i) => {
      const row: any = {};
      for (let j = 0; j < columns; j++) {
        row[`Col${j}`] = `val_${startIndex + i}_${j}`;
      }
      return row;
    });
    return { startIndex, headers, rows };
  };

  const mockFile = new File(["dummy"], "test.xlsx");

  // Force garbage collection before measuring if possible
  if (global.gc) {
    global.gc();
  }

  const memBefore = process.memoryUsage().heapUsed;

  const parser = new ExcelParser(mockFile as any, chunkSize);
  const generator = parser.parse();

  // Start the generator
  const p1 = generator.next();

  // Allow microtasks to process so ExcelParser creates the worker
  await new Promise((resolve) => setTimeout(resolve, 0));

  if (!activeWorker) throw new Error("Worker not created");
  const worker = activeWorker;

  const startTime = performance.now();

  // Producer simulation - dispatch async to avoid blocking event loop
  const dispatchChunks = async () => {
    for (let i = 0; i < numChunks; i++) {
      worker.send({ type: "chunk", payload: generateChunk(i * chunkSize) });
      // yield to event loop every few chunks to prevent blocking and allow consumer to drain
      if (i % 20 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
    worker.send({ type: "done" });
  };

  dispatchChunks();

  // Consumer loop
  let count = 0;
  const firstResult = await p1;
  if (firstResult.value) {
    count += firstResult.value.rows.length;
  }

  for await (const chunk of generator) {
    count += chunk.rows.length;
  }

  const elapsed = performance.now() - startTime;

  if (global.gc) {
    global.gc();
  }
  const memAfter = process.memoryUsage().heapUsed;
  const memDelta = memAfter - memBefore;

  console.log(`Elapsed:\n${Math.round(elapsed)} ms\n`);
  console.log(`Rows/sec:\n${formatNumber((numRows / elapsed) * 1000)}\n`);
  console.log(`Chunks/sec:\n${formatNumber((numChunks / elapsed) * 1000)}\n`);
  console.log(`Heap before:\n${formatBytes(memBefore)}\n`);
  console.log(`Heap after:\n${formatBytes(memAfter)}\n`);
  console.log(`Heap delta:\n${formatBytes(memDelta)}\n`);

  if (count !== numRows) {
    console.error(`ERROR: Expected ${numRows} rows, but got ${count}.`);
  }

  // cleanup
  activeWorker = null;
}

async function main() {
  console.log("Starting IngestX Parser Benchmarks...\n");

  await runBenchmark("Benchmark 1", 1_000_000, 10, 5000);
  await runBenchmark("Benchmark 2", 5_000_000, 10, 10000);
  await runBenchmark("Benchmark 3", 10_000_000, 10, 20000);
  await runBenchmark("Benchmark 4 - Wide dataset", 500_000, 250, 5000);

  console.log("Benchmarks complete.");
}

main().catch(console.error);
