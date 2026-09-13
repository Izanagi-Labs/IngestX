import { vi, test, expect } from "vitest";

// Because setup.ts runs before tests, it mocks this module.
// Let's unmock it for this test file.
vi.unmock("@/src/core/parser/ExcelParser/excel.worker.ts?worker&inline");
// also try without alias just in case
vi.unmock("../src/core/parser/ExcelParser/excel.worker.ts?worker&inline");

import ExcelWorker from "../src/core/parser/ExcelParser/excel.worker.ts?worker&inline";

test("unmocked ExcelWorker", () => {
  console.log("ExcelWorker is:", ExcelWorker);

  let called = false;
  vi.stubGlobal(
    "Worker",
    class {
      constructor() {
        called = true;
      }
    },
  );

  try {
    new ExcelWorker();
  } catch (e) {}

  expect(called).toBe(true);
});
