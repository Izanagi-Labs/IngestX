import { describe, it, expect } from "vitest";
import { ingest, ix, IngestionStatus } from "@/src/index";
import type { ColumnConfig, Progress } from "@/src/index";
import { generateCSV } from "./fixtures";

describe("E2E: Cancellation", () => {
  it("terminates parsing when cancelled", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number() },
    ];

    const rows = Array.from({ length: 50000 }, (_, i) => [i + 1]);
    const file = generateCSV(["ID"], rows);

    let chunksProcessed = 0;

    const ingestion = ingest({
      file,
      columns,
      chunkSize: 1000,
      onChunkProcessed: () => {
        chunksProcessed++;
        if (chunksProcessed === 1) {
          ingestion.cancel();
        }
      },
    });

    const { status, data, error } = await ingestion.result;

    expect(status).toBe(IngestionStatus.Cancelled);
    expect(error).toBeNull();
    // Only a subset of rows should be processed
    expect(data?.validRowsCount).toBeGreaterThan(0);
    expect(data?.validRowsCount).toBeLessThan(50000);
  });

  it("ensures cancellation is idempotent", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number() },
    ];

    const rows = Array.from({ length: 10000 }, (_, i) => [i + 1]);
    const file = generateCSV(["ID"], rows);

    const events: Progress[] = [];

    const ingestion = ingest({
      file,
      columns,
      chunkSize: 1000,
      onProgress: (p) => events.push(p),
      onChunkProcessed: () => {
        // Cancel multiple times
        ingestion.cancel();
        ingestion.cancel();
        ingestion.cancel();
      },
    });

    const { status } = await ingestion.result;

    expect(status).toBe(IngestionStatus.Cancelled);

    // Exactly one terminal event of phase 'cancelled'
    const cancelledEvents = events.filter((e) => e.phase === "cancelled");
    expect(cancelledEvents.length).toBe(1);

    // No completed event after cancellation
    const completedEvents = events.filter((e) => e.phase === "completed");
    expect(completedEvents.length).toBe(0);
  });

  it("allows safe cancellation after completion", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number() },
    ];

    const file = generateCSV(["ID"], [[1], [2]]);
    const ingestion = ingest({ file, columns });

    const { status } = await ingestion.result;
    expect(status).toBe(IngestionStatus.Completed);

    // Cancel after completed
    ingestion.cancel();

    // State should remain COMPLETED according to lifecycle contract
    expect(ingestion.status).toBe(IngestionStatus.Completed);
  });
});
