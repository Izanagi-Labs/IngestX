import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { CSVParser } from "../../../src/core/parser/CsvParser";

// Minimal FileReader polyfill to allow PapaParse to read Node's native File objects
class PolyfillFileReader {
  public result: string | null = null;
  public error: Error | null = null;
  public onload: ((ev: any) => void) | null = null;
  public onerror: ((ev: any) => void) | null = null;

  public readAsText(file: File) {
    file
      .text()
      .then((text) => {
        this.result = text;
        if (this.onload) this.onload({ target: this });
      })
      .catch((err) => {
        this.error = err;
        if (this.onerror) this.onerror({ target: this });
      });
  }
}

describe("CSVParser", () => {
  beforeAll(() => {
    (global as any).FileReader = PolyfillFileReader;
  });

  afterAll(() => {
    delete (global as any).FileReader;
  });

  const createCsvFile = (content: string, name = "test.csv") => {
    return new File([content], name, { type: "text/csv" });
  };

  const consumeAll = async (parser: CSVParser) => {
    const chunks = [];
    for await (const chunk of parser.parse()) {
      chunks.push(chunk);
    }
    return chunks;
  };

  it("should parse a basic CSV and emit a single chunk", async () => {
    const csv = `name,age,email\nJohn,25,john@example.com\nJane,30,jane@example.com`;
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);

    const chunks = await consumeAll(parser);

    expect(chunks.length).toBe(1);
    expect(chunks[0].headers).toEqual(["name", "age", "email"]);
    expect(chunks[0].startIndex).toBe(0);
    expect(chunks[0].rows).toHaveLength(2);
    expect(chunks[0].rows[0]).toEqual({
      name: "John",
      age: "25",
      email: "john@example.com",
    });
    expect(chunks[0].rows[1]).toEqual({
      name: "Jane",
      age: "30",
      email: "jane@example.com",
    });
  });

  it("should chunk the output according to chunkSize (in bytes)", async () => {
    let csv = `id,value\n`;
    for (let i = 0; i < 25; i++) {
      csv += `${i},val${i}\n`;
    }
    const file = createCsvFile(csv);
    // 30 bytes chunk size will force PapaParse to emit multiple chunks
    const parser = new CSVParser(file, false, 30);

    const chunks = await consumeAll(parser);

    expect(chunks.length).toBeGreaterThan(1);

    let expectedStartIndex = 0;
    let totalRows = 0;
    for (const chunk of chunks) {
      expect(chunk.startIndex).toBe(expectedStartIndex);
      expectedStartIndex += chunk.rows.length;
      totalRows += chunk.rows.length;
    }

    expect(totalRows).toBe(25);
  });

  it("should include headers on every emitted chunk and preserve order", async () => {
    let csv = `B,A,C\n`;
    for (let i = 0; i < 5; i++) {
      csv += `1,2,3\n`;
    }
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 20);

    const chunks = await consumeAll(parser);
    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      expect(chunk.headers).toEqual(["B", "A", "C"]);
    }
  });

  it("should work with CSV containing only headers", async () => {
    const csv = `col1,col2,col3`;
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);

    const chunks = await consumeAll(parser);
    // PapaParse yields 1 chunk with 0 data rows for header-only CSVs.
    expect(chunks.length).toBe(1);
    expect(chunks[0].rows).toHaveLength(0);
    expect(chunks[0].headers).toEqual(["col1", "col2", "col3"]);
  });

  it("should handle duplicate headers (PapaParse behavior)", async () => {
    const csv = `A,A,B\n1,2,3`;
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);
    const chunks = await consumeAll(parser);

    // PapaParse typically overwrites duplicate headers so the last one wins,
    // PapaParse automatically renames duplicate headers with _1, _2, etc.
    expect(chunks.length).toBe(1);
    expect(chunks[0].headers).toEqual(["A", "A_1", "B"]);
    // We don't strictly assert the row object format for duplicates as PapaParse behavior might vary,
    // but the generator should process it without crashing.
  });

  it("should respect skipEmptyLines: true for blank lines", async () => {
    const csv = `name,age\n\nJohn,25\n\n\nJane,30\n`;
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);

    const chunks = await consumeAll(parser);
    expect(chunks.length).toBe(1);
    expect(chunks[0].rows).toHaveLength(2);
    expect(chunks[0].rows[0]).toEqual({ name: "John", age: "25" });
    expect(chunks[0].rows[1]).toEqual({ name: "Jane", age: "30" });
  });

  it("should handle quoted CSV values properly, including multiline", async () => {
    const csv = `name,description\nJohn,"Hello, world"\nJane,"Line one\nLine two"\nBob,"Contains ""quotes"""`;
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);

    const chunks = await consumeAll(parser);
    expect(chunks[0].rows).toHaveLength(3);
    expect(chunks[0].rows[0]).toEqual({
      name: "John",
      description: "Hello, world",
    });
    expect(chunks[0].rows[1]).toEqual({
      name: "Jane",
      description: "Line one\nLine two",
    });
    expect(chunks[0].rows[2]).toEqual({
      name: "Bob",
      description: 'Contains "quotes"',
    });
  });

  it("should preserve data values as strings", async () => {
    const csv = `id,active,price\n001,true,12.50\n002,false,100`;
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);

    const chunks = await consumeAll(parser);
    expect(chunks[0].rows[0].id).toBe("001");
    expect(chunks[0].rows[0].active).toBe("true");
    expect(chunks[0].rows[0].price).toBe("12.50");
    expect(chunks[0].rows[1].price).toBe("100");
  });

  it("should safely process wide CSVs without data loss", async () => {
    const cols = 100;
    const rows = 100;
    const headers = Array.from({ length: cols }, (_, i) => `Col${i}`).join(",");
    let csv = headers + "\n";

    for (let i = 0; i < rows; i++) {
      const row = Array.from({ length: cols }, (_, j) => `val${i}_${j}`).join(
        ",",
      );
      csv += row + "\n";
    }

    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 10000);
    const chunks = await consumeAll(parser);

    let totalParsed = 0;
    for (const chunk of chunks) {
      expect(chunk.headers.length).toBe(100);
      totalParsed += chunk.rows.length;
    }
    expect(totalParsed).toBe(100);
    expect(chunks[0].rows[0]["Col99"]).toBe("val0_99");
    expect(
      chunks[chunks.length - 1].rows[chunks[chunks.length - 1].rows.length - 1][
        "Col99"
      ],
    ).toBe("val99_99");
  });

  it("should propagate errors correctly from PapaParse", async () => {
    const csv = `id,value\n1,one`;
    const file = createCsvFile(csv);

    // Simulate PapaParse throwing an error by overriding the FileReader polyfill temporarily
    const originalRead = PolyfillFileReader.prototype.readAsText;
    PolyfillFileReader.prototype.readAsText = function () {
      this.error = new Error("Simulated Read Error");
      if (this.onerror) this.onerror({ target: this });
    };

    const parser = new CSVParser(file, false, 10000);

    await expect(consumeAll(parser)).rejects.toThrow("Simulated Read Error");

    // Restore polyfill
    PolyfillFileReader.prototype.readAsText = originalRead;
  });

  it("should not require consuming all chunks immediately (Async generator semantics)", async () => {
    let csv = `id,val\n`;
    for (let i = 0; i < 20; i++) {
      csv += `${i},val${i}\n`;
    }
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 30);
    const generator = parser.parse();

    const firstChunk = await generator.next();
    expect(firstChunk.value?.startIndex).toBe(0);
    expect(firstChunk.value?.rows.length).toBeGreaterThan(0);

    // Give PapaParse time to enqueue more chunks
    await new Promise((resolve) => setTimeout(resolve, 50));

    const secondChunk = await generator.next();
    expect(secondChunk.value?.startIndex).toBe(firstChunk.value?.rows.length);
  });

  it("should maintain strict chunk ordering even when queued", async () => {
    let csv = `id\n`;
    for (let i = 0; i < 50; i++) {
      csv += `${i}\n`;
    }
    const file = createCsvFile(csv);
    const parser = new CSVParser(file, false, 20);
    const generator = parser.parse();

    // Give PapaParse time to parse everything into the internal queue
    await new Promise((resolve) => setTimeout(resolve, 50));

    const chunks = [];
    for await (const chunk of generator) {
      chunks.push(chunk);
    }

    expect(chunks.length).toBeGreaterThan(1);
    for (let i = 0; i < chunks.length - 1; i++) {
      expect(chunks[i].startIndex).toBeLessThan(chunks[i + 1].startIndex);
      expect(chunks[i + 1].startIndex).toBe(
        chunks[i].startIndex + chunks[i].rows.length,
      );
    }
  });

  it("should handle chunkSize edge cases", async () => {
    const csv = `id\n1\n2\n3`;
    const file = createCsvFile(csv);

    // Chunk size 5 bytes (very small)
    const parser1 = new CSVParser(file, false, 5);
    const chunks1 = await consumeAll(parser1);
    expect(chunks1.length).toBeGreaterThan(1);

    // Chunk size > total
    const parser2 = new CSVParser(file, false, 100000);
    const chunks2 = await consumeAll(parser2);
    expect(chunks2.length).toBe(1);
  });

  describe("Worker Mode", () => {
    it.skip("should behave identically to non-worker mode", async () => {
      // NOTE: PapaParse worker mode relies on creating a Web Worker via URL.createObjectURL(new Blob(...))
      // Node.js does not support these DOM APIs natively.
      // This test is deliberately skipped in the Node testing environment.
      // To run this test, a proper browser-based testing environment (like Playwright/Cypress) is required.

      const csv = `id\n1\n2\n3`;
      const file = createCsvFile(csv);
      const parser = new CSVParser(file, true, 10000);
      const chunks = await consumeAll(parser);
      expect(chunks.length).toBe(1);
      expect(chunks[0].rows).toHaveLength(3);
    });
  });
});
