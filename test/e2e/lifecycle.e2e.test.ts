import { describe, it, expect } from "vitest";
import { ingest, ix, IngestionStatus } from "@/src/index";
import type { ColumnConfig } from "@/src/index";
import { generateCSV } from "./fixtures";

describe("E2E: Lifecycle (Pause/Resume & Concurrent)", () => {
  it("can pause and resume ingestion deterministically", async () => {
    const columns: ColumnConfig[] = [
      {
        key: "id",
        name: "ID",
        schema: ix.number().min(0),
      },
    ];

    const totalRows = 5000;
    const rows = Array.from({ length: totalRows }, (_, i) => [i + 1]);
    const file = generateCSV(["ID"], rows);

    let chunksProcessed = 0;
    let wasPaused = false;
    let resumed = false;

    const ingestion = ingest({
      file,
      columns,
      chunkSize: 1000,
      collectResults: true,
      onChunkProcessed: () => {
        chunksProcessed++;

        // Pause after the first chunk
        if (chunksProcessed === 1) {
          ingestion.pause();
          wasPaused = true;

          // Verify status synchronously changes to PAUSED
          expect(ingestion.status).toBe(IngestionStatus.Paused);

          // Resume after a short delay to simulate consumer interaction
          setTimeout(() => {
            resumed = true;
            ingestion.resume();
            expect(ingestion.status).toBe(IngestionStatus.Running);
          }, 50);
        }
      },
    });

    const { data, status, error } = await ingestion.result;

    if (error) console.log("Lifecycle Error:", error);

    expect(error).toBeNull();
    expect(status).toBe(IngestionStatus.Completed);
    expect(wasPaused).toBe(true);
    expect(resumed).toBe(true);
    expect(data?.validRowsCount).toBe(totalRows);

    // Ensure no rows were lost or duplicated
    expect(data?.validRows.length).toBe(totalRows);
    const firstId = data?.validRows[0].id;
    const lastId = data?.validRows[totalRows - 1].id;
    expect(firstId).toBe(1);
    expect(lastId).toBe(totalRows);
  });

  it("supports concurrent independent ingestions", async () => {
    const columns: ColumnConfig[] = [
      { key: "id", name: "ID", schema: ix.number().min(0) },
    ];

    const fileA = generateCSV(["ID"], [[1], [2], [3]]);
    const fileB = generateCSV(["ID"], [[10], [20], [30]]);

    const ingestionA = ingest({ file: fileA, columns, collectResults: true });
    const ingestionB = ingest({ file: fileB, columns, collectResults: true });

    const [resultA, resultB] = await Promise.all([
      ingestionA.result,
      ingestionB.result,
    ]);

    expect(resultA.status).toBe(IngestionStatus.Completed);
    expect(resultB.status).toBe(IngestionStatus.Completed);

    expect(resultA.data?.validRowsCount).toBe(3);
    expect(resultB.data?.validRowsCount).toBe(3);

    expect(resultA.data?.validRows[0].id).toBe(1);
    expect(resultB.data?.validRows[0].id).toBe(10);
  });
});
