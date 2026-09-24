import { describe, it, expect } from "vitest";
import { DEFAULT_SAMPLE_CSV, SAMPLE_FILENAME, createSampleFile } from "../../apps/web/lib/demo/sampleData";

describe("Demo Sample Data", () => {
  it("should have correct deterministic filename", () => {
    expect(SAMPLE_FILENAME).toBe("ingestx-sample.csv");
  });

  it("should match default schema headers", () => {
    const headerRow = DEFAULT_SAMPLE_CSV.split("\n")[0];
    expect(headerRow.trim()).toBe("Name,Age,Email");
  });

  it("should have expected row count (deterministic)", () => {
    const rows = DEFAULT_SAMPLE_CSV.split("\n").filter(Boolean);
    // 1 header + 28 data rows = 29 rows total
    expect(rows.length).toBe(29);
  });

  it("should contain representative valid and invalid examples", () => {
    // Valid example
    expect(DEFAULT_SAMPLE_CSV).toContain("Alice,28,alice@example.com");

    // Invalid examples based on default schema:
    
    // min(2) name failure
    expect(DEFAULT_SAMPLE_CSV).toContain("A,30,short@example.com");
    
    // number parsing failure
    expect(DEFAULT_SAMPLE_CSV).toContain("Victor,abc,victor@example.com");
    
    // missing required age
    expect(DEFAULT_SAMPLE_CSV).toContain("Wendy,,wendy@example.com");
  });

  it("should contain explicit duplicate demonstration", () => {
    // Both Alice and Xavier rows have "alice@example.com"
    expect(DEFAULT_SAMPLE_CSV).toContain("Alice,28,alice@example.com");
    expect(DEFAULT_SAMPLE_CSV).toContain("Xavier,34,alice@example.com");
    
    // Both Bob and Zane have "bob@example.com"
    expect(DEFAULT_SAMPLE_CSV).toContain("Bob,34,bob@example.com");
    expect(DEFAULT_SAMPLE_CSV).toContain("Zane,31,bob@example.com");
  });

  it("should create a valid CSV File object", () => {
    // In Node/jsdom, File might not be fully featured, but we can test basic creation if available
    if (typeof File !== "undefined") {
      const file = createSampleFile();
      expect(file).toBeInstanceOf(File);
      expect(file.name).toBe(SAMPLE_FILENAME);
      expect(file.type).toBe("text/csv");
      expect(file.size).toBeGreaterThan(0);
    }
  });
});
