import { describe, it, expect } from "vitest";
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

describe("React Import Safety (SSR)", () => {
  it("can import the built react module in a pure Node process without DOM/Vite leaks", () => {
    const builtPath = path.resolve(__dirname, "../../dist/react.js");
    if (!fs.existsSync(builtPath)) {
      console.warn(
        "Skipping React import-safety test because dist/react.js does not exist yet. Run `npm run build` first.",
      );
      return;
    }

    const testScriptPath = path.resolve(__dirname, "temp-react-import-test.js");

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

      // We must fake 'react' if it is not resolved, but Node should be able to resolve it from node_modules.
      import(${JSON.stringify(builtPath)}).then((IngestXReact) => {
        if (typeof IngestXReact.useIngest !== 'function') {
           console.error("FAIL: useIngest function not exported");
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
