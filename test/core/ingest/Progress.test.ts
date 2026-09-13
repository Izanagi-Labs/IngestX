/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { coreIngest } from "@/src/core/ingest";
import { createParser } from "@/src/core/parser";
const ingest = (options: any) => coreIngest(options, createParser);
import type { Progress } from "@/src/core/ingest/types";
import { ColumnConfig } from "@/src/model";
import type { BaseSchema } from "@/src/model/schema/BaseSchema";
import type { RuleType } from "@/src/model/schema/types/RuleType";
import { IngestionStatus } from "@/src/core/controller";

const mockSchema = {
  _getRules: () => [],
} as unknown as BaseSchema<RuleType>;

const columns: ColumnConfig[] = [{ key: "a", name: "A", schema: mockSchema }];

function createMockCsvFile(content: string, name = "test.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

describe("ProgressTracker Lifecycle and Features", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("emits initializing -> parsing -> completed for a successful CSV ingestion", async () => {
    const file = createMockCsvFile("A\n1\n2\n");
    const progressEvents: Progress[] = [];

    const instance = ingest({
      file,
      columns,
      onProgress: (p) => {
        progressEvents.push({ ...p });
      },
    });

    await instance.result;

    const phases = progressEvents.map((p) => p.phase);
    expect(phases).toContain("initializing");
    expect(phases).toContain("parsing");
    expect(phases[phases.length - 1]).toBe("completed");
    
    // Verify basis and types for CSV
    const parsingEvents = progressEvents.filter((p) => p.phase === "parsing");
    const lastParsingEvent = parsingEvents[parsingEvents.length - 1];
    expect(lastParsingEvent.basis).toBe("bytes");
    expect(lastParsingEvent.totalBytes).toBe(file.size);
    expect(lastParsingEvent.totalRows).toBeUndefined();
    expect(lastParsingEvent.processedBytes).toBeGreaterThan(0);
    
    const finalEvent = progressEvents[progressEvents.length - 1];
    expect(finalEvent.percentage).toBe(1);
    expect(finalEvent.processedBytes).toBe(file.size);
    expect(finalEvent.processedRows).toBe(2);
  });

  it("emits initializing -> failed on header mismatch without extracting rows", async () => {
    const file = createMockCsvFile("B\n1\n2\n");
    const progressEvents: Progress[] = [];

    const instance = ingest({
      file,
      columns,
      onProgress: (p) => progressEvents.push({ ...p }),
    });

    await instance.result;

    const phases = progressEvents.map((p) => p.phase);
    expect(phases[0]).toBe("initializing");
    expect(phases[phases.length - 1]).toBe("failed");
    expect(phases).not.toContain("parsing");
    
    const finalEvent = progressEvents[progressEvents.length - 1];
    expect(finalEvent.processedRows).toBe(0);
  });

  it("handles 0-byte file correctly (Fix #10 preservation)", async () => {
    const file = createMockCsvFile("");
    const progressEvents: Progress[] = [];

    const instance = ingest({
      file,
      columns,
      onProgress: (p) => progressEvents.push({ ...p }),
    });

    await instance.result;

    const phases = progressEvents.map((p) => p.phase);
    expect(phases[0]).toBe("initializing");
    expect(phases[phases.length - 1]).toBe("failed"); // HEADER_MISMATCH
  });

  it("emits cancelled exactly once (Idempotency) and stops emitting", async () => {
    const file = createMockCsvFile("A\n1\n2\n3\n4\n5\n");
    const progressEvents: Progress[] = [];

    const instance = ingest({
      file,
      columns,
      chunkSize: 1, // small chunk to allow pausing/cancelling mid-stream
      onProgress: (p) => progressEvents.push({ ...p }),
    });

    // Cancel after a tiny delay
    setTimeout(() => {
      instance.cancel();
      instance.cancel(); // Second cancel should be ignored
      instance.cancel(); // Third cancel should be ignored
    }, 5);

    try {
      await instance.result;
    } catch (e) {
      // Cancellation throws
    }

    const cancelledEvents = progressEvents.filter((p) => p.phase === "cancelled");
    expect(cancelledEvents.length).toBe(1);
    
    const finalEvent = progressEvents[progressEvents.length - 1];
    expect(finalEvent.phase).toBe("cancelled"); // No further progress emitted after cancel
  });

  it("does not advance progress while paused", async () => {
    const file = createMockCsvFile("A\n1\n2\n3\n4\n5\n");
    const progressEvents: Progress[] = [];

    const instance = ingest({
      file,
      columns,
      chunkSize: 1,
      onProgress: (p) => progressEvents.push({ ...p }),
    });

    instance.pause();
    
    // Wait a bit to ensure it doesn't process chunks while paused
    await new Promise((r) => setTimeout(r, 20));
    
    const countWhilePaused = progressEvents.length;
    
    instance.resume();
    await instance.result;

    const countAfterResume = progressEvents.length;
    expect(countAfterResume).toBeGreaterThan(countWhilePaused);
  });

});
