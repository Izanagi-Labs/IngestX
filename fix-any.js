const fs = require("fs");

let content = fs.readFileSync(
  "test/core/ingest/IngestionCancellation.test.ts",
  "utf-8",
);

// Add imports
content = content.replace(
  'import { IngestionStatus } from "@/src/core/controller";",
  'import { IngestionStatus } from "@/src/core/controller";\nimport type { MockInstance } from "vitest";\nimport type { BaseSchema } from "../../../src/model/schema/BaseSchema";\nimport type { RuleType } from "../../../src/model/schema/types/RuleType";",
);

// mockSchema
content = content.replace("} as any;", "} as unknown as BaseSchema<RuleType>;");

// papaparseAbortSpy
content = content.replace(
  /let papaparseAbortSpy: any;/g,
  "let papaparseAbortSpy: MockInstance | undefined;",
);

// Papa.parse
content = content.replace(
  /vi\.spyOn\(Papa, "parse"\)\.mockImplementation\(\(f: any, config: any\) => \{/g,
  'vi.spyOn(Papa, "parse").mockImplementation((f: unknown, config: unknown) => {\n        const c = config as Papa.ParseConfig;\n        // @ts-expect-error - overload matching',
);

content = content.replace(
  /return originalParse\(f, \{/g,
  "return originalParse(f as File, {",
);

content = content.replace(
  /if \(config\.chunk\) config\.chunk\(results, p\);/g,
  "if (c.chunk) c.chunk(results, p);",
);

content = content.replace(/\.\.\.config,/g, "...c,");

// let r: any;
content = content.replace("let r: any;", "let r: unknown;");

// catch (e: any)
content = content.replace("catch (e: any) {", "catch (e: unknown) {");
content = content.replace(
  'if (e.name === "AssertionError") throw e;',
  'if (e instanceof Error && e.name === "AssertionError") throw e;',
);

// workerOnMessage
content = content.replace(
  "let workerOnMessage: any;",
  "let workerOnMessage: ((ev: any) => void) | undefined;", // Wait, we can't use `any`! Let's use `((ev: MessageEvent) => void) | undefined;`
);

content = content.replace(
  /let workerOnMessage: \(\(ev: any\) => void\) \| undefined;/g,
  "let workerOnMessage: ((ev: MessageEvent) => void) | undefined;",
);

// set onmessage
content = content.replace(
  /set onmessage\(fn: any\) \{/g,
  "set onmessage(fn: (ev: MessageEvent) => void) {",
);

// We need to fix the workerOnMessage payload as well
content = content.replace(
  /workerOnMessage\(\{/g,
  "workerOnMessage({\n                // @ts-expect-error - partial message event",
);

fs.writeFileSync("test/core/ingest/IngestionCancellation.test.ts", content);
