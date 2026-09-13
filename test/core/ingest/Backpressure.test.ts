/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import Papa from "papaparse";
import { coreIngest } from "@/src/core/ingest";
import { createParser } from "@/src/core/parser";

vi.unmock("@/src/core/parser/ExcelParser/excel.worker.ts?worker&inline");

const ingest = (options: any) => coreIngest(options, createParser);
import { IngestionCancelledError } from "@/src/core/errors";
import { IngestionStatus } from "@/src/core/controller";
import type { BaseSchema } from "@/src/model/schema/BaseSchema";
import type { RuleType } from "@/src/model/schema/types/RuleType";

const mockSchema = {
  _getRules: () => [],
} as unknown as BaseSchema<RuleType>;

describe("Ingestion Backpressure", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("CSV Backpressure (PapaParse)", () => {
    it("pauses PapaParse when queue hits MAX_BUFFERED_CHUNKS and resumes when consumed", async () => {
      const file = new File(
        [
          Array.from({ length: 100 })
            .map((_, i) => i.toString())
            .join("\n"),
        ],
        "test.csv",
        { type: "text/csv" },
      );

      let papaparsePauseSpy: ReturnType<typeof vi.spyOn> | undefined;
      let papaparseResumeSpy: ReturnType<typeof vi.spyOn> | undefined;

      const mockParser = {
        pause: vi.fn(),
        resume: vi.fn(),
        abort: vi.fn(),
      };
      papaparsePauseSpy = mockParser.pause as any;
      papaparseResumeSpy = mockParser.resume as any;

      vi.spyOn(Papa, "parse").mockImplementation(
        (f: unknown, config: unknown) => {
          const c = config as Papa.ParseConfig;
          setTimeout(() => {
            if (c.chunk) {
              c.chunk(
                { data: [{ a: "1" }], meta: { fields: ["a"] } } as any,
                mockParser as any,
              );
              c.chunk(
                { data: [{ a: "2" }], meta: { fields: ["a"] } } as any,
                mockParser as any,
              );
              c.chunk(
                { data: [{ a: "3" }], meta: { fields: ["a"] } } as any,
                mockParser as any,
              );
            }
            if (c.complete) c.complete({} as any, mockParser as any);
          }, 10);
        },
      );

      const instance = ingest({
        file,
        columns: [{ key: "a", name: "a", schema: mockSchema }],
        onChunkProcessed: async () => {
          // Add delay to simulate slow consumer
          await new Promise((resolve) => setTimeout(resolve, 10));
        },
      });

      await instance.result;

      expect(papaparsePauseSpy).toHaveBeenCalled();
      expect(papaparseResumeSpy).toHaveBeenCalled();
    });
  });

  describe("Excel Backpressure (Worker)", () => {
    it("requests chunks iteratively (demand-driven)", async () => {
      const file = new File(["test"], "test.xlsx");

      let workerOnMessage: ((ev: MessageEvent) => void) | undefined;
      let requestedCount = 0;
      let returnedChunks = 0;

      const mockWorkerPostMessage = vi.fn((msg: any) => {
        setTimeout(() => {
          if (!workerOnMessage) return;
          if (msg.type === "init") {
            workerOnMessage({ data: { type: "ready", headers: ["a"] } } as any);
          } else if (msg.type === "next") {
            requestedCount++;
            if (returnedChunks < 4) {
              workerOnMessage({
                data: {
                  type: "chunk",
                  payload: {
                    headers: ["a"],
                    rows: [{ a: String(returnedChunks) }],
                    startIndex: returnedChunks,
                  },
                },
              } as any);
              returnedChunks++;
            } else {
              workerOnMessage({ data: { type: "done" } } as any);
            }
          }
        }, 0);
      });

      const MockWorker = vi.fn().mockImplementation(() => ({
        postMessage: mockWorkerPostMessage,
        terminate: vi.fn(),
        set onmessage(fn: (ev: MessageEvent) => void) {
          workerOnMessage = fn;
        },
        get onmessage() {
          return workerOnMessage;
        },
      }));
      vi.stubGlobal("Worker", MockWorker);

      let processedChunks = 0;
      const instance = ingest({
        file,
        columns: [{ key: "a", name: "a", schema: mockSchema }],
        onChunkProcessed: async () => {
          processedChunks++;
          // simulate slow consumer
          await new Promise((r) => setTimeout(r, 10));
        },
      });

      await instance.result;

      expect(processedChunks).toBe(4);
      expect(requestedCount).toBeGreaterThanOrEqual(4);

      // Ensure the init message + next messages were sent sequentially
      const calls = mockWorkerPostMessage.mock.calls.map((c) => c[0].type);
      expect(calls[0]).toBe("init");
      expect(calls.filter((c) => c === "next").length).toBe(requestedCount);
    });
  });
});
