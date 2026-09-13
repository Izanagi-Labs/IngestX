const fs = require("fs");
let content = fs.readFileSync(
  "test/core/ingest/IngestionCancellation.test.ts",
  "utf-8",
);

// Update worker mock in IngestionCancellation.test.ts
content = content.replace(
  /postMessage: vi\.fn\(\(\) => \{[\s\S]*?setTimeout\(\(\) => \{[\s\S]*?if \(workerOnMessage\) \{[\s\S]*?\/\/ @ts-expect-error - partial message event[\s\S]*?workerOnMessage\(\{[\s\S]*?data: \{[\s\S]*?type: "chunk",[\s\S]*?payload: \{[\s\S]*?headers: \["a"\],[\s\S]*?rows: \[\{ a: "1" \}\],[\s\S]*?startIndex: 0,[\s\S]*?\},[\s\S]*?\},[\s\S]*?\}\);[\s\S]*?\/\/ @ts-expect-error - partial message event[\s\S]*?workerOnMessage\(\{[\s\S]*?data: \{[\s\S]*?type: "chunk",[\s\S]*?payload: \{[\s\S]*?headers: \["a"\],[\s\S]*?rows: \[\{ a: "2" \}\],[\s\S]*?startIndex: 1,[\s\S]*?\},[\s\S]*?\},[\s\S]*?\}\);[\s\S]*?\}[\s\S]*?\}, 0\);[\s\S]*?\}\),/g,
  `postMessage: vi.fn((msg: any) => {
          setTimeout(() => {
            if (!workerOnMessage) return;
            if (msg.type === "init") {
              workerOnMessage({ data: { type: "ready" } } as any);
            } else if (msg.type === "next") {
              // @ts-expect-error
              workerOnMessage({
                data: { type: "chunk", payload: { headers: ["a"], rows: [{ a: "1" }], startIndex: 0 } },
              });
            }
          }, 0);
        }),`,
);

fs.writeFileSync("test/core/ingest/IngestionCancellation.test.ts", content);
