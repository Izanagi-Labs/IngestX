import { describe, it, expect } from "vitest";
import { OutputCollector } from "@/src/core/ingest/OutputCollector";
import { ChunkValidationResult } from "@/src/core/ingest/types";

describe("OutputCollector", () => {
  const createMockChunk = (
    numValid: number,
    numInvalid: number,
  ): ChunkValidationResult<any> => {
    const validRows = Array.from({ length: numValid }).map((_, i) => ({
      rowIndex: i,
      data: { col: `valid_${i}` },
      errors: {},
    }));

    const invalidRows = Array.from({ length: numInvalid }).map((_, i) => ({
      rowIndex: numValid + i,
      data: { col: `invalid_${i}` },
      errors: { col: [{ message: `Error ${i}` }] },
    }));

    return { validRows, invalidRows } as unknown as ChunkValidationResult<any>;
  };

  it("should NOT accumulate rows if collectResults is false", () => {
    const collector = new OutputCollector(false);
    const chunk = createMockChunk(10, 5);

    collector.add(chunk);

    const output = collector.getFinalOutput();

    expect(output.totalRows).toBe(15);
    expect(output.validRowsCount).toBe(10);
    expect(output.invalidRowsCount).toBe(5);

    expect(output.validRows.length).toBe(0);
    expect(output.invalidRows.length).toBe(0);
    expect(output.errorsData.rowWiseErrors.length).toBe(0);
  });

  it("should accumulate rows if collectResults is true", () => {
    const collector = new OutputCollector(true);
    const chunk = createMockChunk(2, 1);

    collector.add(chunk);

    const output = collector.getFinalOutput();

    expect(output.totalRows).toBe(3);
    expect(output.validRowsCount).toBe(2);
    expect(output.invalidRowsCount).toBe(1);

    expect(output.validRows.length).toBe(2);
    expect(output.validRows[0]).toEqual({ col: "valid_0" });

    expect(output.invalidRows.length).toBe(1);
    expect(output.invalidRows[0]).toEqual({ col: "invalid_0" });

    expect(output.errorsData.rowWiseErrors.length).toBe(1);
    expect(output.errorsData.rowWiseErrors[0]).toMatchObject({
      rowIndex: 2,
      columnKey: "col",
      receivedValue: "invalid_0",
      errorMessage: "Error 0",
    });
  });

  it("should enforce maxCollectedRows exact boundary succeeds", () => {
    const collector = new OutputCollector(true, 5);
    collector.add(createMockChunk(3, 2)); // Total 5
    const output = collector.getFinalOutput();
    expect(output.totalRows).toBe(5);
  });

  it("should enforce maxCollectedRows limit when incoming chunk exceeds the remaining capacity (atomic failure)", () => {
    const collector = new OutputCollector(true, 100);
    collector.add(createMockChunk(90, 5)); // 95 rows total

    // Incoming chunk has 10 rows (95 + 10 = 105 > 100)
    // Should throw CollectionLimitExceededError and NOT modify arrays
    expect(() => {
      collector.add(createMockChunk(5, 5));
    }).toThrow("Memory limit exceeded: maxCollectedRows (100) reached.");

    // Arrays and counts must remain exactly as they were (95)
    const output = collector.getFinalOutput();
    expect(output.totalRows).toBe(95);
    expect(output.validRowsCount).toBe(90);
    expect(output.invalidRowsCount).toBe(5);
    expect(output.validRows.length).toBe(90);
    expect(output.invalidRows.length).toBe(5);
  });

  it("should enforce maxCollectedRows limit when valid rows exactly exceed limit by 1", () => {
    const collector = new OutputCollector(true, 5);
    collector.add(createMockChunk(3, 2)); // 5 rows

    // Next chunk with 1 row should throw
    expect(() => {
      collector.add(createMockChunk(1, 0));
    }).toThrow("Memory limit exceeded: maxCollectedRows (5) reached.");
  });

  it("should NOT throw if collectResults is false even if rows exceed limit", () => {
    const collector = new OutputCollector(false, 5);
    collector.add(createMockChunk(10, 10)); // 20 rows
    const output = collector.getFinalOutput();
    expect(output.totalRows).toBe(20);
    expect(output.validRows.length).toBe(0);
  });

  describe("originalData reporting", () => {
    it("should report originalData when present (e.g., ' 123 ' -> transformed 123)", () => {
      const collector = new OutputCollector(true);
      const invalidRow = {
        rowIndex: 0,
        data: { col: 123 }, // transformed
        originalData: { col: " 123 " }, // raw
        errors: { col: [{ message: "Error" }] },
      } as any;
      collector.add({ validRows: [], invalidRows: [invalidRow] });

      const output = collector.getFinalOutput();
      expect(output.errorsData.rowWiseErrors[0].receivedValue).toBe(" 123 ");
    });

    it("should preserve null original value", () => {
      const collector = new OutputCollector(true);
      const invalidRow = {
        rowIndex: 0,
        data: { col: "transformed_null" },
        originalData: { col: null },
        errors: { col: [{ message: "Error" }] },
      } as any;
      collector.add({ validRows: [], invalidRows: [invalidRow] });

      const output = collector.getFinalOutput();
      expect(output.errorsData.rowWiseErrors[0].receivedValue).toBe(null);
    });

    it("should preserve undefined original value", () => {
      const collector = new OutputCollector(true);
      const invalidRow = {
        rowIndex: 0,
        data: { col: "transformed_undefined" },
        originalData: { col: undefined },
        errors: { col: [{ message: "Error" }] },
      } as any;
      collector.add({ validRows: [], invalidRows: [invalidRow] });

      const output = collector.getFinalOutput();
      expect(output.errorsData.rowWiseErrors[0].receivedValue).toBe(undefined);
    });

    it("should handle multiple invalid fields", () => {
      const collector = new OutputCollector(true);
      const invalidRow = {
        rowIndex: 0,
        data: { col1: "t1", col2: "t2" },
        originalData: { col1: "raw1", col2: "raw2" },
        errors: {
          col1: [{ message: "E1" }],
          col2: [{ message: "E2" }],
        },
      } as any;
      collector.add({ validRows: [], invalidRows: [invalidRow] });

      const output = collector.getFinalOutput();
      expect(output.errorsData.rowWiseErrors.length).toBe(2);
      expect(
        output.errorsData.rowWiseErrors.find((e: any) => e.columnKey === "col1")
          ?.receivedValue,
      ).toBe("raw1");
      expect(
        output.errorsData.rowWiseErrors.find((e: any) => e.columnKey === "col2")
          ?.receivedValue,
      ).toBe("raw2");
    });

    it("should not affect valid rows (valid rows have no originalData)", () => {
      const collector = new OutputCollector(true);
      const validRow = {
        rowIndex: 0,
        data: { col: 123 },
        errors: {},
      } as any;
      collector.add({ validRows: [validRow], invalidRows: [] });

      const output = collector.getFinalOutput();
      expect(output.validRows[0]).toEqual({ col: 123 });
      expect("originalData" in output.validRows[0]).toBe(false);
    });

    it("should fall back to data if originalData is absent", () => {
      const collector = new OutputCollector(true);
      const invalidRow = {
        rowIndex: 0,
        data: { col: "fallback_value" },
        errors: { col: [{ message: "Error" }] },
      } as any;
      collector.add({ validRows: [], invalidRows: [invalidRow] });

      const output = collector.getFinalOutput();
      expect(output.errorsData.rowWiseErrors[0].receivedValue).toBe(
        "fallback_value",
      );
    });
  });
});
