import { describe, it, expect } from "vitest";
import { ingest, ix, IngestionStatus, IngestionErrorType } from "@/src/index";
import type { ColumnConfig, Progress } from "@/src/index";
import {
  generateEmptyCSV,
  generateEmptyExcel,
  generateHeadersOnlyCSV,
  generateHeadersOnlyExcel,
  generateCSV,
  generateExcel,
} from "./fixtures";

describe("E2E: Edge Cases & Degenerate Inputs", () => {
  const columns: ColumnConfig[] = [
    { key: "id", name: "ID", schema: ix.number() },
  ];

  describe("CSV Edge Cases", () => {
    it("handles 0-byte CSV files with HEADER_MISMATCH and no parsing phase", async () => {
      const file = generateEmptyCSV();
      const events: Progress[] = [];

      const ingestion = ingest({
        file,
        columns,
        onProgress: (p) => events.push(p),
      });

      const { status, error } = await ingestion.result;

      expect(status).toBe("failed");
      expect(error?.type).toBe(IngestionErrorType.HEADER_MISMATCH);

      // Verify 'parsing' phase never occurred
      const parsingEvents = events.filter((e) => e.phase === "parsing");
      expect(parsingEvents.length).toBe(0);
    });

    it("handles headers-only CSV files safely", async () => {
      const file = generateHeadersOnlyCSV(["ID"]);
      const ingestion = ingest({ file, columns });

      const { status, data, error } = await ingestion.result;

      expect(error).toBeNull();
      expect(status).toBe(IngestionStatus.Completed);
      expect(data?.validRowsCount).toBe(0);
      expect(data?.invalidRowsCount).toBe(0);
    });

    it("successfully ingests a single-row CSV", async () => {
      const file = generateCSV(["ID"], [[42]]);
      const ingestion = ingest({ file, columns });

      const { status, data } = await ingestion.result;
      expect(status).toBe(IngestionStatus.Completed);
      expect(data?.validRowsCount).toBe(1);
    });
  });

  describe("Excel Edge Cases", () => {
    it("handles 0-byte Excel files gracefully", async () => {
      const file = generateEmptyExcel();
      const events: Progress[] = [];

      const ingestion = ingest({
        file,
        columns,
        onProgress: (p) => events.push(p),
      });

      const { status, error } = await ingestion.result;

      // The parser now gracefully yields empty headers, triggering our 0-byte logic
      expect(status).toBe("failed");
      expect(error).not.toBeNull();
      expect(error?.type).toBe(IngestionErrorType.HEADER_MISMATCH);

      const parsingEvents = events.filter((e) => e.phase === "parsing");
      expect(parsingEvents.length).toBe(0);
    });

    it("handles headers-only Excel files safely", async () => {
      const file = generateHeadersOnlyExcel(["ID"]);
      const ingestion = ingest({ file, columns });

      const { status, data, error } = await ingestion.result;

      expect(error).toBeNull();
      expect(status).toBe(IngestionStatus.Completed);
      expect(data?.validRowsCount).toBe(0);
      expect(data?.invalidRowsCount).toBe(0);
    });

    it("successfully ingests a single-row Excel", async () => {
      const file = generateExcel(["ID"], [[42]]);
      const ingestion = ingest({ file, columns });

      const { status, data } = await ingestion.result;
      expect(status).toBe(IngestionStatus.Completed);
      expect(data?.validRowsCount).toBe(1);
    });
  });
});
