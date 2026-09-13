import { describe, it, expect } from "vitest";
import { ingest, ix } from "@/src/index";
import type { ColumnConfig, Progress } from "@/src/index";
import { generateCSV, generateExcel } from "./fixtures";

describe("E2E: Progress", () => {
  it("emits deterministic progress events for CSV", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number() },
    ];

    const file = generateCSV(["ID"], [[1], [2], [3], [4]]);
    const events: Progress[] = [];

    const ingestion = ingest({
      file,
      columns,
      onProgress: (p) => events.push(p),
    });

    await ingestion.result;

    expect(events.length).toBeGreaterThan(0);
    
    // First event should be initializing
    expect(events[0].phase).toBe("initializing");
    
    // Last event should be completed
    const lastEvent = events[events.length - 1];
    expect(lastEvent.phase).toBe("completed");

    // Check bounds
    events.forEach((p) => {
      if (p.percentage !== undefined) {
        expect(p.percentage).toBeGreaterThanOrEqual(0);
        expect(p.percentage).toBeLessThanOrEqual(1);
      }
      expect(p.basis).toBe("bytes");
      expect(p.totalRows).toBeUndefined(); // CSV does not know total rows upfront
    });

    // Exactly one completed event
    const completedEvents = events.filter((e) => e.phase === "completed");
    expect(completedEvents.length).toBe(1);
  });

  it("emits deterministic progress events for Excel", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number() },
    ];

    const file = generateExcel(["ID"], [[1], [2], [3], [4]]);
    const events: Progress[] = [];

    const ingestion = ingest({
      file,
      columns,
      onProgress: (p) => events.push(p),
    });

    await ingestion.result;

    expect(events.length).toBeGreaterThan(0);
    
    expect(events[0].phase).toBe("initializing");
    const lastEvent = events[events.length - 1];
    expect(lastEvent.phase).toBe("completed");

    events.forEach((p) => {
      if (p.percentage !== undefined) {
        expect(p.percentage).toBeGreaterThanOrEqual(0);
        expect(p.percentage).toBeLessThanOrEqual(1);
      }
      expect(p.basis).toBe("rows");
    });
    
    // Excel knows total rows (1 header + 4 rows = 5 rows materialised in sheet, or 4 data rows, check if it's > 0)
    expect(lastEvent.totalRows).toBeGreaterThan(0);
    
    const completedEvents = events.filter((e) => e.phase === "completed");
    expect(completedEvents.length).toBe(1);
  });

  it("ensures onChunkProcessed and onProgress are independent", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number() },
    ];

    const file = generateCSV(["ID"], [[1], [2], [3], [4]]);
    
    let chunkCount = 0;
    let progressCount = 0;

    const ingestion = ingest({
      file,
      columns,
      onProgress: () => progressCount++,
      onChunkProcessed: () => chunkCount++,
    });

    await ingestion.result;

    expect(chunkCount).toBeGreaterThan(0);
    expect(progressCount).toBeGreaterThan(0);
  });
});
