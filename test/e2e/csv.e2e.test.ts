import { describe, it, expect } from "vitest";
import { ingest, ix, IngestionStatus } from "@/src/index";
import type { ColumnConfig } from "@/src/index";
import { generateCSV } from "./fixtures";

describe("E2E: CSV Happy Path", () => {
  it("successfully ingests a valid CSV file", async () => {
    const columns: ColumnConfig[] = [
      {
        key: "name",
        name: "Name",
        schema: ix.string().min(2),
      },
      {
        key: "age",
        name: "Age",
        schema: ix.number().min(18),
      },
    ];

    const file = generateCSV(
      ["Name", "Age"],
      [
        ["Alice", 30],
        ["Bob", 25],
        ["Charlie", 40],
      ],
    );

    const ingestion = ingest({
      file,
      columns,
      collectResults: true,
    });

    const { data, error, status } = await ingestion.result;

    if (error) {
      console.error(JSON.stringify(error, null, 2));
    }

    console.log("csv.e2e data:", JSON.stringify(data, null, 2));

    expect(error).toBeNull();
    expect(status).toBe(IngestionStatus.Completed);
    expect(data?.validRowsCount).toBe(3);
    expect(data?.invalidRowsCount).toBe(0);
    expect(data?.validRows).toEqual([
      { name: "Alice", age: 30 },
      { name: "Bob", age: 25 },
      { name: "Charlie", age: 40 },
    ]);
  });

  it("streams chunks incrementally via onChunkProcessed", async () => {
    const columns: ColumnConfig[] = [
      {
        key: "id",
        name: "ID",
        schema: ix.number(),
      },
    ];

    const rows = Array.from({ length: 5000 }, (_, i) => [i + 1]);
    const file = generateCSV(["ID"], rows);

    let chunksReceived = 0;
    let totalRowsProcessed = 0;

    const ingestion = ingest({
      file,
      columns,
      chunkSize: 1000,
      collectResults: true,
      onChunkProcessed: (chunkResult) => {
        chunksReceived++;
        totalRowsProcessed += chunkResult.output.validRows.length;
      },
    });

    const result = await ingestion.result;
    if (result.error) console.log("CSV Error:", result.error);

    // Should process in multiple chunks (at least 2 depending on chunking logic)
    expect(chunksReceived).toBeGreaterThan(1);
    expect(totalRowsProcessed).toBe(5000);
  });
});
