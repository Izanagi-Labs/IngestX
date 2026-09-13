import { describe, it, expect } from "vitest";
import { ingest, ix, IngestionErrorType } from "@/src/index";
import type { ColumnConfig } from "@/src/index";
import { generateCSV } from "./fixtures";

describe("E2E: Validation & Header Mismatch", () => {
  it("detects invalid rows according to the schema", async () => {
    const columns: ColumnConfig[] = [
      {
        key: "name",
        name: "Name",
        schema: ix.string().min(2).max(50),
      },
      {
        key: "age",
        name: "Age",
        schema: ix.number().min(18).max(120),
      },
      {
        key: "active",
        name: "Active",
        schema: ix.boolean().truthy(["true"]).falsy(["false"]),
      },
    ];

    const file = generateCSV(
      ["Name", "Age", "Active"],
      [
        ["Alice", 30, "true"], // Valid
        ["A", 30, "true"], // Invalid: Name too short
        ["Bob", 12, "true"], // Invalid: Age too young
        ["Charlie", 40, "not-a-boolean"], // Invalid: not a boolean
      ],
    );

    const ingestion = ingest({
      file,
      columns,
      collectResults: true,
    });

    const { data, error } = await ingestion.result;

    expect(error).toBeNull();
    expect(data?.validRowsCount).toBe(1);
    expect(data?.invalidRowsCount).toBe(3);

    expect(data?.invalidRows.length).toBe(3);

    // The first invalid row should be "A", 30, "true"
    expect(data?.invalidRows[0]).toMatchObject({
      name: "A",
    });
  });

  it("fails with HEADER_MISMATCH when exact headers are not found", async () => {
    const columns: ColumnConfig[] = [
      {
        key: "name",
        name: "Name",
        schema: ix.string(),
      },
      {
        key: "age",
        name: "Age",
        schema: ix.number(),
      },
    ];

    const file = generateCSV(
      ["Name", "Email"], // Missing 'Age'
      [["Alice", "alice@example.com"]],
    );

    const ingestion = ingest({
      file,
      columns,
      collectResults: true,
    });

    const { error, status } = await ingestion.result;

    expect(status).toBe("failed");
    expect(error?.type).toBe(IngestionErrorType.HEADER_MISMATCH);
    expect(error?.message).toContain(
      "File headers do not match the expected schema.",
    );
  });

  it("respects matchHeader for header variations", async () => {
    const columns: ColumnConfig[] = [
      {
        key: "name",
        name: "Name",
        matchHeader: (h) => h.toLowerCase() === "full name",
        schema: ix.string(),
      },
    ];

    const file = generateCSV(["Full Name"], [["Alice"]]);

    const ingestion = ingest({
      file,
      columns,
      collectResults: true,
    });

    const { data, error } = await ingestion.result;

    expect(error).toBeNull();
    expect(data?.validRowsCount).toBe(1);
    expect(data?.validRows[0]).toEqual({ name: "Alice" });
  });
});
