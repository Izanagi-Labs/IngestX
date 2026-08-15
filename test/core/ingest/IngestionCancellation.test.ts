/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import Papa from "papaparse";
import { ingest } from "../../../src/core/ingest";
import {
  IngestionCancelledError,
  isIngestionCancelledError,
} from "../../../src/core/errors";
import { IngestionErrorType } from "../../../src/core/ingest/types";
import { IngestionStatus } from "../../../src/core/controller";
import type { MockInstance } from "vitest";
import type { BaseSchema } from "../../../src/model/schema/BaseSchema";
import type { RuleType } from "../../../src/model/schema/types/RuleType";

const mockSchema = {
  _getRules: () => [],
} as unknown as BaseSchema<RuleType>;

describe("Ingestion Cancellation & Cleanup Flow", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("Controller -> Parser Cancellation", () => {
    it("cancelling ingestion calls the parser lifecycle method and stops iteration", async () => {
      const file = new File(["a,b\n1,2\n3,4"], "test.csv", {
        type: "text/csv",
      });

      // Mock PapaParse to track when it stops
      const originalParse = Papa.parse;
      let papaparseAbortSpy: any;
      vi.spyOn(Papa, "parse").mockImplementation((f: any, config: any) => {
        return originalParse(f, {
          ...config,
          chunk: (results, p) => {
            if (!papaparseAbortSpy) {
              papaparseAbortSpy = vi.spyOn(p, "abort");
            }
            if (config.chunk) config.chunk(results, p);
          },
        });
      });

      let chunksProcessed = 0;

      const instance = ingest({
        file,
        columns: [
          { key: "a", name: "a", schema: mockSchema },
          { key: "b", name: "b", schema: mockSchema },
        ],
        onChunkProcessed: async () => {
          chunksProcessed++;
          instance.cancel(); // Cancel midway
        },
      });

      let r: unknown;
      try {
        r = await instance.result;
        console.error("PROMISE RESOLVED! Result was:", r);
        expect.fail(`Should have thrown IngestionCancelledError`);
      } catch (e: unknown) {
        if (e instanceof Error && e.name === "AssertionError") throw e;
        expect(e).toBeInstanceOf(IngestionCancelledError);
      }

      expect(chunksProcessed).toBe(1);
      expect(papaparseAbortSpy).toHaveBeenCalled();
      expect(instance.status).toBe(IngestionStatus.Cancelled);
    });

    it("cancellation is idempotent", async () => {
      const file = new File(["a\n1"], "test.csv", { type: "text/csv" });
      const instance = ingest({
        file,
        columns: [{ key: "a", name: "a", schema: mockSchema }],
        onChunkProcessed: async () => {
          instance.cancel();
          instance.cancel();
          instance.cancel();
        },
      });

      try {
        await instance.result;
      } catch (e) {
        expect(e).toBeInstanceOf(IngestionCancelledError);
      }
      expect(instance.status).toBe(IngestionStatus.Cancelled);
    });
  });

  describe("Excel cancellation", () => {
    it("worker terminates and no new chunks are produced", async () => {
      const file = new File(["test"], "test.xlsx");

      const mockTerminate = vi.fn();
      let workerOnMessage: ((ev: MessageEvent) => void) | undefined;
      const MockWorker = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn((msg: any) => {
          setTimeout(() => {
            if (!workerOnMessage) return;
            if (msg.type === "init") {
              workerOnMessage({ data: { type: "ready" } } as any);
            } else if (msg.type === "next") {
              // @ts-expect-error - partial message event
              workerOnMessage({
                data: {
                  type: "chunk",
                  payload: {
                    headers: ["a"],
                    rows: [{ a: "1" }],
                    startIndex: 0,
                  },
                },
              });
            }
          }, 0);
        }),
        terminate: mockTerminate,
        set onmessage(fn: (ev: MessageEvent) => void) {
          workerOnMessage = fn;
        },
        get onmessage() {
          return workerOnMessage;
        },
      }));
      vi.stubGlobal("Worker", MockWorker);

      let chunksProcessed = 0;
      const instance = ingest({
        file,
        columns: [{ key: "a", name: "a", schema: mockSchema }],
        onChunkProcessed: async () => {
          chunksProcessed++;
          instance.cancel(); // Cancel on first chunk
        },
      });

      try {
        await instance.result;
      } catch (e) {
        expect(e).toBeInstanceOf(IngestionCancelledError);
      }

      // Worker should have been terminated
      expect(mockTerminate).toHaveBeenCalled();
      // Only one chunk should have been processed
      expect(chunksProcessed).toBe(1);
    });
  });

  describe("Async iterator cleanup", () => {
    it("parser iterator does not remain pending forever after cancellation", async () => {
      const file = new File(["test"], "test.xlsx");

      const mockTerminate = vi.fn();
      const MockWorker = vi.fn().mockImplementation(() => ({
        postMessage: vi.fn(), // never sends chunk or done
        terminate: mockTerminate,
      }));
      vi.stubGlobal("Worker", MockWorker);

      const instance = ingest({
        file,
        columns: [{ key: "a", name: "a", schema: mockSchema }],
      });

      // It is waiting for the first chunk. We cancel it.
      instance.cancel();

      try {
        await instance.result;
        expect.fail("Should throw IngestionCancelledError");
      } catch (e) {
        expect(e).toBeInstanceOf(IngestionCancelledError);
      }

      // The result promise should have resolved (meaning it didn't hang)
      expect(mockTerminate).toHaveBeenCalled();
    });
  });

  describe("Cancellation during validation", () => {
    it("ensures no subsequent chunks are processed after cancellation during validation", async () => {
      const file = new File(["a\n1\n2\n3"], "test.csv", { type: "text/csv" });

      let chunksProcessed = 0;
      const instance = ingest({
        file,
        // Using small chunk size is not directly possible through options right now,
        // but we'll mock PapaParse to yield small chunks.
        columns: [{ key: "a", name: "a", schema: mockSchema }],
        onChunkProcessed: async () => {
          chunksProcessed++;
          // Simulate a long validation/processing step
          await new Promise((r) => setTimeout(r, 10));
          instance.cancel();
        },
      });

      const originalParse = Papa.parse;
      vi.spyOn(Papa, "parse").mockImplementation(
        (f: unknown, config: unknown) => {
          const c = config as Papa.ParseConfig;
          // @ts-expect-error - overload matching
          return originalParse(f as File, { ...c, chunkSize: 2 }); // very small chunks
        },
      );

      try {
        await instance.result;
      } catch (e) {
        expect(e).toBeInstanceOf(IngestionCancelledError);
      }

      expect(chunksProcessed).toBe(1); // Second chunk shouldn't be processed
    });
  });

  describe("Early error cleanup", () => {
    it("cleans up parser when a validation/header error occurs", async () => {
      const file = new File(["wrong_header\n1"], "test.csv", {
        type: "text/csv",
      });

      let papaparseAbortSpy: MockInstance | undefined;
      const originalParse = Papa.parse;
      vi.spyOn(Papa, "parse").mockImplementation(
        (f: unknown, config: unknown) => {
          const c = config as Papa.ParseConfig;
          // @ts-expect-error - overload matching
          return originalParse(f as File, {
            ...c,
            chunk: (results, p) => {
              if (!papaparseAbortSpy) {
                papaparseAbortSpy = vi.spyOn(p, "abort");
              }
              if (c.chunk) c.chunk(results, p);
            },
          });
        },
      );

      const instance = ingest({
        file,
        columns: [
          {
            key: "expected_header",
            name: "expected_header",
            schema: mockSchema,
          },
        ], // This will cause header mismatch
      });

      const result = await instance.result;

      expect(result.error?.type).toBe(IngestionErrorType.HEADER_MISMATCH);
      expect(papaparseAbortSpy).toHaveBeenCalled(); // Parser should have been aborted
    });
  });

  describe("Normal completion", () => {
    it("does not error out during normal completion and cleans up", async () => {
      const file = new File(["a\n1\n2"], "test.csv", { type: "text/csv" });

      let papaparseAbortSpy: MockInstance | undefined;
      const originalParse = Papa.parse;
      vi.spyOn(Papa, "parse").mockImplementation(
        (f: unknown, config: unknown) => {
          const c = config as Papa.ParseConfig;
          // @ts-expect-error - overload matching
          return originalParse(f as File, {
            ...c,
            chunk: (results, p) => {
              if (!papaparseAbortSpy) {
                papaparseAbortSpy = vi.spyOn(p, "abort");
              }
              if (c.chunk) c.chunk(results, p);
            },
          });
        },
      );

      const instance = ingest({
        file,
        columns: [{ key: "a", name: "a", schema: mockSchema }],
        collectResults: true,
      });

      const result = await instance.result;

      expect(result.error).toBeNull();
      expect(result.data.validRows.length).toBe(2);
      expect(papaparseAbortSpy).toHaveBeenCalled(); // Should still be cleaned up
    });
  });
});
