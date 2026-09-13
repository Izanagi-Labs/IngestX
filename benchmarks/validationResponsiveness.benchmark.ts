import { ingest } from "@/src/core/ingest";
import { StringSchema, NumberSchema } from "@/src/model";

// Mock File API for Node environment benchmarking
class MockFile {
  name: string;
  size: number;
  type: string;
  _content: string;

  constructor(parts: any[], name: string, options: any = {}) {
    this.name = name;
    this.type = options.type || "";
    this._content = parts.join("");
    this.size = this._content.length;
  }

  stream() {
    const content = this._content;
    let offset = 0;
    const chunkSize = 64 * 1024;
    return new ReadableStream({
      pull(controller) {
        if (offset >= content.length) {
          controller.close();
          return;
        }
        const end = Math.min(offset + chunkSize, content.length);
        const chunk = content.slice(offset, end);
        controller.enqueue(new TextEncoder().encode(chunk));
        offset = end;
      },
    });
  }
}

// Ensure global File is available
if (typeof globalThis.File === "undefined") {
  (globalThis as any).File = MockFile;
}

// Minimal FileReader polyfill to allow PapaParse to read native File objects
class PolyfillFileReader {
  public result: string | null = null;
  public error: Error | null = null;
  public onload: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;

  public readAsText(file: File | any) {
    if (typeof file.text === "function") {
      file
        .text()
        .then((text: string) => {
          this.result = text;
          if (this.onload) this.onload({ target: this });
        })
        .catch((err: Error) => {
          this.error = err;
          if (this.onerror) this.onerror({ target: this });
        });
    } else if (file._content) {
      // Fallback for MockFile
      this.result = file._content;
      if (this.onload) setTimeout(() => this.onload!({ target: this }), 0);
    }
  }
}
(global as any).FileReader = PolyfillFileReader;

const generateCsv = (rowCount: number, rowGenerator: (i: number) => string) => {
  const chunks: string[] = ["id,name,email,age,status\n"];
  for (let i = 0; i < rowCount; i++) {
    chunks.push(rowGenerator(i) + "\n");
  }
  return chunks.join("");
};

const schemas = {
  lightweight: [
    { key: "id", displayNames: ["id"], type: "number" as const },
    { key: "name", displayNames: ["name"], type: "string" as const },
  ],
  multiple: [
    {
      key: "id",
      displayNames: ["id"],
      type: "number" as const,
      schema: new NumberSchema().min(0).max(1000000),
    },
    {
      key: "name",
      displayNames: ["name"],
      type: "string" as const,
      schema: new StringSchema().min(2).max(100),
    },
    {
      key: "email",
      displayNames: ["email"],
      type: "string" as const,
      schema: new StringSchema().regex(/^[^@]+@[^@]+\.[^@]+$/),
    },
    {
      key: "age",
      displayNames: ["age"],
      type: "number" as const,
      schema: new NumberSchema().min(18).max(99),
    },
  ],
  regexHeavy: [
    {
      key: "email",
      displayNames: ["email"],
      type: "string" as const,
      schema: new StringSchema().regex(
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,
      ),
    },
    {
      key: "status",
      displayNames: ["status"],
      type: "string" as const,
      schema: new StringSchema().regex(/^(ACTIVE|INACTIVE|PENDING)$/),
    },
  ],
  custom: [
    {
      key: "name",
      displayNames: ["name"],
      type: "string" as const,
      schema: new StringSchema().custom((val) => [
        String(val).length > 5,
        "Too short",
      ]),
    },
  ],
};

async function runBenchmark(
  rowCount: number,
  chunkSize: number,
  schemaType: keyof typeof schemas,
) {
  const csvContent = generateCsv(
    rowCount,
    (i) => `${i},User${i},user${i}@example.com,${20 + (i % 50)},ACTIVE`,
  );
  const file = new File([csvContent], "test.csv", { type: "text/csv" });

  let maxBlockTime = 0;
  let lastTick = performance.now();
  let tickCount = 0;

  // Background interval to measure event loop lag
  const interval = setInterval(() => {
    const now = performance.now();
    const diff = now - lastTick;
    if (diff > maxBlockTime && tickCount > 0) {
      maxBlockTime = diff;
    }
    lastTick = now;
    tickCount++;
  }, 5);

  const start = performance.now();

  const instance = ingest({
    file: file as any,
    columns: schemas[schemaType] as any,
    chunkSize,
    collectResults: false,
  });

  await new Promise<void>((resolve, reject) => {
    const check = setInterval(() => {
      if (instance.status === "completed") {
        clearInterval(check);
        resolve();
      } else if (
        instance.status === "failed" ||
        instance.status === "cancelled" ||
        instance.status === "error"
      ) {
        clearInterval(check);
        reject(
          new Error(
            "Ingestion did not complete successfully. Status: " +
              instance.status,
          ),
        );
      }
    }, 10);
  });

  const end = performance.now();
  clearInterval(interval);

  const duration = end - start;
  const rowsPerSec = (rowCount / duration) * 1000;

  return {
    rowCount,
    chunkSize,
    schemaType,
    durationMs: duration,
    rowsPerSec,
    maxBlockTimeMs: Math.max(0, maxBlockTime - 5), // subtract expected interval time
  };
}

async function main() {
  console.log("Starting Validation Responsiveness Benchmark...");

  const scenarios = [{ rows: 100000, chunks: [10000, 2000, 1000, 500] }];

  const schemaTypes = [
    "lightweight",
    "multiple",
    "regexHeavy",
    "custom",
  ] as const;

  for (const scenario of scenarios) {
    for (const schema of schemaTypes) {
      for (const chunk of scenario.chunks) {
        // Warmup
        await runBenchmark(1000, chunk, schema);

        const result = await runBenchmark(scenario.rows, chunk, schema);
        console.log(
          `[${schema}] Rows: ${result.rowCount.toLocaleString()} | Chunk: ${result.chunkSize.toLocaleString()} | ` +
            `Throughput: ${result.rowsPerSec.toFixed(0)} rows/s | Max Block: ${result.maxBlockTimeMs.toFixed(1)}ms | Duration: ${result.durationMs.toFixed(0)}ms`,
        );
      }
    }
  }
}

main().catch(console.error);
