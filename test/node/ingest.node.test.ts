import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { ingest } from "../../src/node";
import fs from "fs";
import path from "path";
import { ix } from "../../src/model/ix";
import { IngestionStatus } from "../../src/core/controller/types";
import * as XLSX from "xlsx";

describe("Node Ingestion E2E", () => {
  const testDir = path.resolve(__dirname, "test-data");
  const csvPath = path.join(testDir, "test.csv");
  const excelPath = path.join(testDir, "test.xlsx");
  const largeCsvPath = path.join(testDir, "large.csv");

  const columns = [
    { key: "name", name: "name", schema: ix.string() },
    { key: "age", name: "age", schema: ix.number().min(0) },
  ];

  beforeAll(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir);
    }
    fs.writeFileSync(csvPath, "name,age\nAlice,30\nBob,25\nCharlie,40");

    const lines = ["name,age"];
    for (let i = 0; i < 5000; i++) {
      lines.push(`Person${i},${i % 100}`);
    }
    fs.writeFileSync(largeCsvPath, lines.join("\n"));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet([
      { name: "Eve", age: 22 },
      { name: "Dave", age: 33 },
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, excelPath);
  });

  afterAll(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("successfully ingests a valid CSV file", async () => {
    const instance = ingest({
      filePath: csvPath,
      columns,
      collectResults: true,
    });

    const result = await instance.result;
    expect(result.status).toBe(IngestionStatus.Completed);
    expect(result.error).toBeNull();
    expect(result.data.validRows.length).toBe(3);
    expect(result.data.validRows[0]).toEqual({ name: "Alice", age: 30 });
  });

  it("successfully ingests a valid Excel file", async () => {
    const instance = ingest({
      filePath: excelPath,
      columns,
      collectResults: true,
    });

    const result = await instance.result;
    expect(result.status).toBe(IngestionStatus.Completed);
    expect(result.error).toBeNull();
    expect(result.data.validRows.length).toBe(2);
    expect(result.data.validRows[0]).toEqual({ name: "Eve", age: 22 });
  });

  it("supports cancellation for CSV", async () => {
    const instance = ingest({
      filePath: largeCsvPath,
      columns,
      chunkSize: 10,
      onChunkProcessed: async ({ chunkIndex }) => {
        if (chunkIndex === 1) {
          instance.cancel();
        }
      },
    });

    const result = await instance.result;
    expect(result.status).toBe(IngestionStatus.Cancelled);
    expect(result.error).toBeNull();
  });

  it("reports progress correctly", async () => {
    const progressEvents: number[] = [];
    const instance = ingest({
      filePath: csvPath,
      columns,
      onProgress: (p) => {
        if (p.percentage !== undefined) {
          progressEvents.push(p.percentage);
        }
      },
    });

    await instance.result;
    expect(progressEvents.length).toBeGreaterThan(0);
    expect(progressEvents[progressEvents.length - 1]).toBe(1);
  });

  it("fails if file path is missing or invalid", () => {
    expect(() => {
      ingest({
        filePath: "does-not-exist.csv",
        columns,
      });
    }).toThrow("File not found");
  });

  it("fails for unsupported file extensions", async () => {
    const txtPath = path.join(testDir, "test.txt");
    fs.writeFileSync(txtPath, "dummy content");

    const instance = ingest({
      filePath: txtPath,
      columns,
    });

    const result = await instance.result;
    expect(result.status).toBe(IngestionStatus.Failed);
    expect(result.error?.message).toContain("Unsupported file type: txt");
  });
});
