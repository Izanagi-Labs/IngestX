import { describe, it } from "vitest";
import ExcelWorker from "@/src/core/parser/ExcelParser/excel.worker.ts?worker&inline";

describe("Worker Test", () => {
  it("inspects the worker constructor", () => {
    console.log("ExcelWorker type:", typeof ExcelWorker);
    console.log("ExcelWorker string:", ExcelWorker.toString());
    try {
      const w = new ExcelWorker();
      console.log("Worker instance:", w);
    } catch (e) {
      console.error("Worker instantiation failed:", e);
    }
  });
});
