/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import * as IngestX from "@/src/index";

describe("Public API Boundary", () => {
  it("exports only intended public runtime APIs", () => {
    const exportedKeys = Object.keys(IngestX).sort();
    
    // Parser classes and internal controllers MUST NOT be exported
    expect(exportedKeys).not.toContain("CSVParser");
    expect(exportedKeys).not.toContain("ExcelParser");
    expect(exportedKeys).not.toContain("IngestionController");
    expect(exportedKeys).not.toContain("OutputCollector");
    expect(exportedKeys).not.toContain("ProgressTracker");
    expect(exportedKeys).not.toContain("StringSchema");
    expect(exportedKeys).not.toContain("NumberSchema");
    expect(exportedKeys).not.toContain("BooleanSchema");
    expect(exportedKeys).not.toContain("BaseSchema");
    
    expect(exportedKeys).toEqual([
      "IngestionErrorType",
      "IngestionStatus",
      "ingest",
      "ix"
    ].sort());
  });

  it("integrates createParser and coreIngest correctly via the public ingest() API", async () => {
    // This test ensures that the browser injection boundary works
    // and that `src/index.ts` properly wires `coreIngest` to `createParser`
    const file = new File(["a,b\n1,2"], "test.csv", { type: "text/csv" });
    const ingestion = IngestX.ingest({
      file,
      columns: [
        { key: "a", name: "a", schema: IngestX.ix.string() },
        { key: "b", name: "b", schema: IngestX.ix.string() }
      ],
      collectResults: true,
    });

    const { status, data, error } = await ingestion.result;
    if (error) {
      console.error("INGESTION ERROR:", error);
    }
    expect(status).toBe(IngestX.IngestionStatus.Completed);
    expect(error).toBeNull();
    expect(data.validRows).toHaveLength(1);
    expect(data.validRows[0]).toEqual({ a: "1", b: "2" });
  });
});

