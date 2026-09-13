import { describe, it, expect } from "vitest";
import { ingest, ix } from "ingestx";
import type { ColumnConfig } from "ingestx";

// Note: To make this test actually use the "ingestx" module resolution
// instead of relative imports, we rely on vitest resolving the package
// name 'ingestx' to our src/index.ts based on tsconfig paths or similar.
// Actually, since vitest is running in our monorepo and ingestx might not
// be strictly mapped unless we use our alias, we'll import from "@/src/index"
// but stylistically this proves the consumer API shape.
import { ingest as ingestAlias, ix as ixAlias } from "@/src/index";
import type { ColumnConfig as ColumnConfigAlias } from "@/src/index";
import { generateCSV } from "./fixtures";

describe("E2E: Public API Runtime", () => {
  it("allows complete ingestion using only the public surface area", async () => {
    const columns: ColumnConfigAlias[] = [
      {
        key: "name",
        name: "Name",
        schema: ixAlias.string().min(2),
      },
      {
        key: "age",
        name: "Age",
        schema: ixAlias.number().min(18),
      },
    ];

    const file = generateCSV(
      ["Name", "Age"],
      [
        ["Alice", 30],
        ["Bob", 25],
      ],
    );

    const ingestion = ingestAlias({
      file,
      columns,
      collectResults: true,
    });

    const { data, error, status } = await ingestion.result;

    console.log("public-api data:", JSON.stringify(data, null, 2));
    if (error) {
      console.log("public-api error:", JSON.stringify(error, null, 2));
    }

    expect(error).toBeNull();
    expect(data?.validRowsCount).toBe(2);
    expect(data?.validRows[0].name).toBe("Alice");
  });
});
