/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from "vitest";
import { coreIngest } from "@/src/core/ingest";
import { createParser } from "@/src/core/parser";
const ingest = (options: any) => coreIngest(options, createParser);
import { IngestionController } from "@/src/core/controller/IngestionController";
import { IngestionStatus } from "@/src/core/controller/types";
import { IngestionErrorType } from "@/src/core/ingest/types";
import { ColumnConfig } from "@/src/model";

vi.unmock("@/src/core/parser/ExcelParser/excel.worker.ts?worker&inline");

function createMockCsvFile(content: string, name = "test.csv"): File {
  return new File([content], name, { type: "text/csv" });
}

import type { BaseSchema } from "@/src/model/schema/BaseSchema";
import type { RuleType } from "@/src/model/schema/types/RuleType";

const mockSchema = {
  _getRules: () => [],
} as unknown as BaseSchema<RuleType>;

describe("Fix #10: Degenerate Inputs & Idempotency", () => {
  const columns: ColumnConfig[] = [
    { key: "name", name: "Name", schema: mockSchema },
    { key: "age", name: "Age", schema: mockSchema },
  ];

  describe("Degenerate Input Semantics", () => {
    it("CsvParser: 0-byte file fails with HEADER_MISMATCH", async () => {
      const file = createMockCsvFile(""); // 0-byte file
      const instance = ingest({ file, columns, collectResults: true });
      const result = await instance.result;

      expect(result.status).toBe(IngestionStatus.Failed);
      expect(result.error).not.toBeNull();
      expect(result.error?.type).toBe(IngestionErrorType.HEADER_MISMATCH);
    });

    it("CsvParser: headers-only file with valid schema succeeds with 0 rows", async () => {
      const file = createMockCsvFile("Name,Age\n");
      const instance = ingest({ file, columns, collectResults: true });
      const result = await instance.result;

      expect(result.error).toBeNull();
      expect(result.status).toBe(IngestionStatus.Completed);
      expect(result.data.totalRows).toBe(0);
    });

    it("CsvParser: headers-only file with invalid schema fails with HEADER_MISMATCH", async () => {
      const file = createMockCsvFile("Invalid,Headers\n");
      const instance = ingest({ file, columns, collectResults: true });
      const result = await instance.result;

      expect(result.error).not.toBeNull();
      expect(result.error?.type).toBe(IngestionErrorType.HEADER_MISMATCH);
    });

    it("ExcelParser: 0-byte file deterministic result (INGESTION_ERROR for invalid xlsx format)", async () => {
      const file = new File([""], "test.xlsx", {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const instance = ingest({ file, columns, collectResults: true });
      const result = await instance.result;

      expect(result.status).toBe(IngestionStatus.Failed);
      expect(result.error).not.toBeNull();
      expect(result.error?.type).toBe(IngestionErrorType.INGESTION_ERROR);
    });
  });

  describe("Cancellation Idempotency", () => {
    it("Controller.cancel() is idempotent and does not refire listeners", () => {
      const controller = new IngestionController();
      controller.start();

      let cancelCallCount = 0;
      controller.onCancel(() => {
        cancelCallCount++;
      });

      controller.cancel();
      expect(cancelCallCount).toBe(1);
      expect(controller.getStatus()).toBe(IngestionStatus.Cancelled);

      // Subsequent calls
      controller.cancel();
      controller.cancel();

      expect(cancelCallCount).toBe(1); // Still 1
      expect(controller.getStatus()).toBe(IngestionStatus.Cancelled);
    });

    it("Controller.cancel() does not mutate Completed state", () => {
      const controller = new IngestionController();
      controller.start();
      controller.complete();
      expect(controller.getStatus()).toBe(IngestionStatus.Completed);

      let cancelCallCount = 0;
      controller.onCancel(() => {
        cancelCallCount++;
      });

      controller.cancel();

      expect(cancelCallCount).toBe(0);
      expect(controller.getStatus()).toBe(IngestionStatus.Completed);
    });
  });
});
