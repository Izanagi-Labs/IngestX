/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import Papa from "papaparse";
import { CSVParser } from "../../../src/core/parser/CsvParser";
import { ExcelParser } from "../../../src/core/parser/ExcelParser";
import { Parser } from "../../../src/core/parser/types";

describe("Parser Lifecycle Contract", () => {
  describe("Interface Compliance", () => {
    it("CSVParser satisfies Parser", () => {
      const file = new File(["test"], "test.csv", { type: "text/csv" });
      const parser: Parser = new CSVParser(file);
      expect(typeof parser.abort).toBe("function");
      expect(typeof parser.parse).toBe("function");
    });

    it("ExcelParser satisfies Parser", () => {
      const file = new File(["test"], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const parser: Parser = new ExcelParser(file);
      expect(typeof parser.abort).toBe("function");
      expect(typeof parser.parse).toBe("function");
    });
  });

  describe("CSV Cleanup", () => {
    it("abort() cleans up PapaParse operation", async () => {
      const file = new File(["a,b\n1,2\n3,4"], "test.csv", {
        type: "text/csv",
      });
      const parser = new CSVParser(file, false, 1);

      let papaparseAbortSpy: ReturnType<typeof vi.fn> | undefined;

      // Mock Papa.parse to capture the abort method
      const originalParse = Papa.parse;
      vi.spyOn(Papa, "parse").mockImplementation((file: any, config: any) => {
        return originalParse(file, {
          ...config,
          chunk: (results, p) => {
            if (!papaparseAbortSpy) {
              papaparseAbortSpy = vi.spyOn(p, "abort");
            }
            if (config.chunk) config.chunk(results, p);
          },
        });
      });

      const generator = parser.parse();
      await generator.next(); // get first chunk

      parser.abort();

      // Ensure Papa.parse internal abort was called
      expect(papaparseAbortSpy).toHaveBeenCalled();

      vi.restoreAllMocks();
    });
  });

  describe("Excel Cleanup", () => {
    it("abort() terminates the active worker", async () => {
      const file = new File(["test"], "test.xlsx");
      const parser = new ExcelParser(file);

      // Mock Worker
      const MockWorker = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
      }));
      vi.stubGlobal("Worker", MockWorker);

      const generator = parser.parse();

      // Wait for initialization to instantiate worker
      const nextPromise = generator.next();
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Worker should have been created
      expect(MockWorker).toHaveBeenCalled();

      const workerInstance = MockWorker.mock.results[0].value;
      expect(workerInstance.terminate).not.toHaveBeenCalled();

      parser.abort();

      expect(workerInstance.terminate).toHaveBeenCalledOnce();

      vi.unstubAllGlobals();
    });
  });

  describe("Generator Cleanup", () => {
    it("early termination of CSV async generator triggers cleanup", async () => {
      const file = new File(["a,b\n1,2\n3,4"], "test.csv", {
        type: "text/csv",
      });
      const parser = new CSVParser(file, false, 1);

      const abortSpy = vi.spyOn(parser, "abort");

      const generator = parser.parse();
      for await (const chunk of generator) {
        break; // Trigger early termination
      }

      expect(abortSpy).toHaveBeenCalled();
    });

    it("early termination of Excel async generator triggers cleanup", async () => {
      const file = new File(["test"], "test.xlsx");
      const parser = new ExcelParser(file);

      // Mock Worker to yield an initial chunk so for-await can enter and break
      const mockTerminate = vi.fn();
      let workerOnMessage: any;
      const MockWorker = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(() => {
          setTimeout(() => {
            if (workerOnMessage) {
              workerOnMessage({
                data: {
                  type: "chunk",
                  payload: { headers: [], rows: [], startIndex: 0 },
                },
              });
            }
          }, 0);
        }),
        terminate: mockTerminate,
        set onmessage(fn: any) {
          workerOnMessage = fn;
        },
        get onmessage() {
          return workerOnMessage;
        },
      }));
      vi.stubGlobal("Worker", MockWorker);

      const abortSpy = vi.spyOn(parser, "abort");
      const generator = parser.parse();

      for await (const chunk of generator) {
        break; // Trigger early termination
      }

      expect(abortSpy).toHaveBeenCalled();
      expect(mockTerminate).toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });
});
