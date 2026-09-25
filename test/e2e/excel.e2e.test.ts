import { describe, it, expect } from "vitest";
import { ingest, ix, IngestionStatus } from "@/src/index";
import type { ColumnConfig } from "@/src/index";
import { generateExcel } from "./fixtures";

describe("E2E: Excel Happy Path", () => {
  it("successfully ingests a valid Excel file", async () => {
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

    const file = generateExcel(
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

    if (error) console.log("Excel Error:", error);

    if (error) {
      console.error(JSON.stringify(error, null, 2));
    }

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
});
