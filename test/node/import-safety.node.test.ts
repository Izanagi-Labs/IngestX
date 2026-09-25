import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

describe("Node Import Safety", () => {
  it("can import the built node module in a pure Node process without DOM/Vite leaks", () => {
    // This test ensures the built node artifact doesn't crash when imported in a bare node process.

    // First, ensure the build exists, else we can't test it.
    // If not built, we skip or fail depending on CI environment, but since this is local testing, we assume build runs first.
    const builtPath = path.resolve(__dirname, "../../dist/node.js");
    if (!fs.existsSync(builtPath)) {
      console.warn(
        "Skipping import-safety test because dist/node.js does not exist yet. Run `npm run build` first.",
      );
      return;
    }

    const testScriptPath = path.resolve(__dirname, "temp-import-test.js");

    // Create a script that imports the module and asserts no window/document exists.
    fs.writeFileSync(
      testScriptPath,
      `
      // Strict verification of pure node context
      if (typeof window !== "undefined") {
        console.error("FAIL: window is defined");
        process.exit(1);
      }
      if (typeof document !== "undefined") {
        console.error("FAIL: document is defined");
        process.exit(1);
      }

      // Dynamic import to support both commonjs and esm contexts cleanly in testing
      import(${JSON.stringify(builtPath)}).then((IngestX) => {
        if (typeof IngestX.ingest !== 'function') {
           console.error("FAIL: ingest function not exported");
           process.exit(1);
        }
        console.log("SUCCESS");
      }).catch(err => {
        console.error("FAIL: Error importing:", err);
        process.exit(1);
      });
    `,
    );

    try {
      const output = execSync(`node ${testScriptPath}`, { encoding: "utf-8" });
      expect(output).toContain("SUCCESS");
    } finally {
      if (fs.existsSync(testScriptPath)) {
        fs.rmSync(testScriptPath);
      }
    }
  });
});
