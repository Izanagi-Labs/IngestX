import { OutputCollector } from "@/src/core/ingest/OutputCollector";
import type { ChunkValidationResult } from "@/src/core/ingest/types";

// Force garbage collection if we run with --expose-gc
const gcIfAvailable = () => {
  if (global.gc) {
    global.gc();
  }
};

const getMemoryUsageMB = () => {
  gcIfAvailable();
  const usage = process.memoryUsage();
  return {
    heapUsed: Math.round((usage.heapUsed / 1024 / 1024) * 100) / 100,
    heapTotal: Math.round((usage.heapTotal / 1024 / 1024) * 100) / 100,
    rss: Math.round((usage.rss / 1024 / 1024) * 100) / 100,
  };
};

const createMockChunk = (
  numValid: number,
  numInvalid: number,
): ChunkValidationResult<any> => {
  const validRows = Array.from({ length: numValid }).map((_, i) => ({
    rowIndex: i,
    data: {
      id: i,
      name: `User ${i}`,
      email: `user${i}@example.com`,
      age: Math.floor(Math.random() * 100),
      isActive: i % 2 === 0,
      createdAt: new Date().toISOString(),
      balance: Math.random() * 10000,
      address: `123 Main St, City, Country, ZIP ${Math.floor(Math.random() * 10000)}`,
      notes:
        "This is a random note that takes up some memory space to simulate a real row.",
    },
    errors: {},
  }));

  const invalidRows = Array.from({ length: numInvalid }).map((_, i) => ({
    rowIndex: numValid + i,
    data: {
      id: numValid + i,
      name: `Invalid User ${i}`,
      email: `invalid${i}`,
    },
    errors: { email: [{ message: "Invalid email format" }] },
  }));

  return { validRows, invalidRows } as unknown as ChunkValidationResult<any>;
};

async function runBenchmark() {
  console.log("Starting OutputCollector Memory Benchmark...");
  console.log("------------------------------------------");

  const TOTAL_ROWS = 500_000;
  const CHUNK_SIZE = 10_000;
  const NUM_CHUNKS = TOTAL_ROWS / CHUNK_SIZE;

  // Run with collectResults: false
  console.log(`\n1. collectResults: false (${TOTAL_ROWS} rows)`);

  let memBefore = getMemoryUsageMB();
  console.log(
    `Initial Memory: ${memBefore.heapUsed} MB (Heap) / ${memBefore.rss} MB (RSS)`,
  );

  const startStream = performance.now();
  let collectorFalse = new OutputCollector(false);

  for (let i = 0; i < NUM_CHUNKS; i++) {
    // 90% valid, 10% invalid
    const chunk = createMockChunk(CHUNK_SIZE * 0.9, CHUNK_SIZE * 0.1);
    collectorFalse.add(chunk);

    // Periodically log memory every 20 chunks
    if ((i + 1) % 20 === 0) {
      const currentMem = getMemoryUsageMB();
      console.log(
        `  Chunk ${i + 1}/${NUM_CHUNKS} - Memory: ${currentMem.heapUsed} MB`,
      );
    }
  }

  const endStream = performance.now();
  const streamResult = collectorFalse.getFinalOutput();
  let memAfterFalse = getMemoryUsageMB();

  console.log(
    `Result: ${streamResult.totalRows} total, ${streamResult.validRows.length} retained valid rows.`,
  );
  console.log(`Time: ${(endStream - startStream).toFixed(2)} ms`);
  console.log(
    `Final Memory: ${memAfterFalse.heapUsed} MB (Heap) / ${memAfterFalse.rss} MB (RSS)`,
  );
  console.log(
    `Net Memory Change: ${(memAfterFalse.heapUsed - memBefore.heapUsed).toFixed(2)} MB`,
  );

  // Clear refs and garbage collect
  // @ts-ignore
  collectorFalse = null;
  gcIfAvailable();
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log(`\n==========================================\n`);

  // Run with collectResults: true
  console.log(`2. collectResults: true (${TOTAL_ROWS} rows)`);
  memBefore = getMemoryUsageMB();
  console.log(
    `Initial Memory: ${memBefore.heapUsed} MB (Heap) / ${memBefore.rss} MB (RSS)`,
  );

  const startCollect = performance.now();
  let collectorTrue = new OutputCollector(true);

  for (let i = 0; i < NUM_CHUNKS; i++) {
    // 90% valid, 10% invalid
    const chunk = createMockChunk(CHUNK_SIZE * 0.9, CHUNK_SIZE * 0.1);
    collectorTrue.add(chunk);

    if ((i + 1) % 20 === 0) {
      const currentMem = getMemoryUsageMB();
      console.log(
        `  Chunk ${i + 1}/${NUM_CHUNKS} - Memory: ${currentMem.heapUsed} MB`,
      );
    }
  }

  const endCollect = performance.now();
  const collectResult = collectorTrue.getFinalOutput();
  let memAfterTrue = getMemoryUsageMB();

  console.log(
    `Result: ${collectResult.totalRows} total, ${collectResult.validRows.length} retained valid rows.`,
  );
  console.log(`Time: ${(endCollect - startCollect).toFixed(2)} ms`);
  console.log(
    `Final Memory: ${memAfterTrue.heapUsed} MB (Heap) / ${memAfterTrue.rss} MB (RSS)`,
  );
  console.log(
    `Net Memory Change: ${(memAfterTrue.heapUsed - memBefore.heapUsed).toFixed(2)} MB`,
  );

  console.log(`\n==========================================\n`);
  console.log(`SUMMARY:`);
  console.log(
    `Memory growth with collectResults=false: ${(memAfterFalse.heapUsed - memBefore.heapUsed).toFixed(2)} MB`,
  );
  console.log(
    `Memory growth with collectResults=true: ${(memAfterTrue.heapUsed - memBefore.heapUsed).toFixed(2)} MB`,
  );
}

runBenchmark().catch(console.error);
