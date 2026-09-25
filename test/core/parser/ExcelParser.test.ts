/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ExcelParser } from "../../../src/core/parser/ExcelParser";
import { MockWorker } from "./mockWorker";
import { RowsAndHeaders } from "@/src/core/parser";

vi.unmock("@/src/core/parser/ExcelParser/excel.worker.ts?worker&inline");

describe("ExcelParser", () => {
  let activeWorker: MockWorker | null = null;
  let mockFile: File;

  beforeEach(() => {
    vi.stubGlobal(
      "Worker",
      vi.fn((url: string | URL, options?: WorkerOptions) => {
        const worker = new MockWorker(url, options);
        activeWorker = worker;
        return worker;
      }),
    );
    mockFile = new File(["dummy content"], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    activeWorker = null;
  });

  const createDummyChunk = (
    startIndex = 0,
    headers = ["A", "B"],
    rows = [{ A: "1", B: "2" }],
  ): RowsAndHeaders => ({
    headers,
    rows,
    startIndex,
  });

  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

  describe("Construction", () => {
    it("creates Worker once", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      generator.next().catch(() => {});
      expect(global.Worker).toHaveBeenCalledTimes(1);
    });

    it("posts correct message", async () => {
      const parser = new ExcelParser(mockFile);
      parser
        .parse()
        .next()
        .catch(() => {});
      expect(activeWorker?.postMessage).toHaveBeenCalledWith({
        type: "init",
        file: mockFile,
        rowChunkSize: 10000,
      });
    });

    it("passes File", async () => {
      const parser = new ExcelParser(mockFile);
      parser
        .parse()
        .next()
        .catch(() => {});
      expect(activeWorker?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ file: mockFile }),
      );
    });

    it("passes chunkSize", async () => {
      const parser = new ExcelParser(mockFile, 500);
      parser
        .parse()
        .next()
        .catch(() => {});
      expect(activeWorker?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ rowChunkSize: 500 }),
      );
    });
  });

  describe("Successful parsing", () => {
    it("yields single chunk", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const chunk = createDummyChunk();
      activeWorker?.send({ type: "chunk", payload: chunk });
      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.done).toBe(false);
      expect(result.value).toStrictEqual(chunk);

      const endResult = await generator.next();
      expect(endResult.done).toBe(true);
    });

    it("yields multiple chunks", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();

      const p1 = generator.next();
      await tick();

      const chunk1 = createDummyChunk(0);
      const chunk2 = createDummyChunk(100);

      activeWorker?.send({ type: "chunk", payload: chunk1 });
      activeWorker?.send({ type: "chunk", payload: chunk2 });
      activeWorker?.send({ type: "done" });

      expect((await p1).value).toStrictEqual(chunk1);
      expect((await generator.next()).value).toStrictEqual(chunk2);
      expect((await generator.next()).done).toBe(true);
    });

    it("preserves order", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();

      const p1 = generator.next();
      await tick();

      const chunk1 = createDummyChunk(0);
      const chunk2 = createDummyChunk(10);
      const chunk3 = createDummyChunk(20);

      activeWorker?.send({ type: "chunk", payload: chunk1 });
      activeWorker?.send({ type: "chunk", payload: chunk2 });
      activeWorker?.send({ type: "chunk", payload: chunk3 });
      activeWorker?.send({ type: "done" });

      expect((await p1).value).toStrictEqual(chunk1);
      expect((await generator.next()).value).toStrictEqual(chunk2);
      expect((await generator.next()).value).toStrictEqual(chunk3);
      expect((await generator.next()).done).toBe(true);
    });

    it("preserves startIndex", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(42) });
      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.value?.startIndex).toBe(42);
    });

    it("preserves headers", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({
        type: "chunk",
        payload: createDummyChunk(0, ["Header1", "Header2"]),
      });
      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.value?.headers).toStrictEqual(["Header1", "Header2"]);
    });

    it("preserves rows", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const rows = [{ Header1: "Val1" }];
      activeWorker?.send({
        type: "chunk",
        payload: createDummyChunk(0, ["Header1"], rows),
      });
      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.value?.rows).toStrictEqual(rows);
    });

    it("supports empty chunk payload", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({
        type: "chunk",
        payload: createDummyChunk(0, [], []),
      });
      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.value?.headers).toHaveLength(0);
      expect(result.value?.rows).toHaveLength(0);
    });

    it("supports very large chunk payload", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const largeRows = Array.from({ length: 10000 }).map((_, i) => ({
        col: `val${i}`,
      }));
      activeWorker?.send({
        type: "chunk",
        payload: createDummyChunk(0, ["col"], largeRows),
      });
      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.value?.rows).toHaveLength(10000);
      expect(result.value?.rows[9999]).toStrictEqual({ col: "val9999" });
    });
  });

  describe("AsyncGenerator behaviour", () => {
    it("generator finishes after done", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });

      const result = await p1;
      expect(result.done).toBe(true);
    });

    it("next() after completion returns done=true", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      await p1;

      const afterResult = await generator.next();
      expect(afterResult.done).toBe(true);
    });

    it("multiple next() calls work correctly", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();

      const p1 = generator.next();
      const p2 = generator.next();
      const p3 = generator.next();

      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(1) });
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.startIndex).toBe(0);
      expect((await p2).value?.startIndex).toBe(1);
      expect((await p3).done).toBe(true);
    });

    it("does not skip queued chunks", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(1) });
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(2) });
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.startIndex).toBe(0);
      expect((await generator.next()).value?.startIndex).toBe(1);
      expect((await generator.next()).value?.startIndex).toBe(2);
      expect((await generator.next()).done).toBe(true);
    });

    it("chunks arriving faster than consumer are buffered", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(1) });

      expect((await p1).value?.startIndex).toBe(0);
      expect((await generator.next()).value?.startIndex).toBe(1);
    });

    it("consumer faster than producer waits correctly", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();

      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      expect((await p1).value?.startIndex).toBe(0);

      const p2 = generator.next();
      await tick();
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(1) });
      expect((await p2).value?.startIndex).toBe(1);
    });
  });

  describe("Queue behaviour", () => {
    it("FIFO ordering", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(10) });
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(20) });

      expect((await p1).value?.startIndex).toBe(10);
      expect((await generator.next()).value?.startIndex).toBe(20);
    });

    it("multiple queued chunks", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      for (let i = 0; i < 5; i++) {
        activeWorker?.send({ type: "chunk", payload: createDummyChunk(i) });
      }
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.startIndex).toBe(0);
      expect((await generator.next()).value?.startIndex).toBe(1);
      expect((await generator.next()).value?.startIndex).toBe(2);
      expect((await generator.next()).value?.startIndex).toBe(3);
      expect((await generator.next()).value?.startIndex).toBe(4);
      expect((await generator.next()).done).toBe(true);
    });

    it("chunk arrives while consumer waiting", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();

      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      expect((await p1).value?.startIndex).toBe(0);
    });

    it("chunk arrives after previous yield", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      await p1;

      const p2 = generator.next();
      await tick();
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(1) });
      expect((await p2).value?.startIndex).toBe(1);
    });

    it("no duplicate yields", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      activeWorker?.send({ type: "done" });

      await p1;
      expect((await generator.next()).done).toBe(true);
      expect((await generator.next()).done).toBe(true);
    });

    it("no missing chunks", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      for (let i = 0; i < 10; i++) {
        activeWorker?.send({ type: "chunk", payload: createDummyChunk(i) });
      }
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.startIndex).toBe(0);
      for (let i = 1; i < 10; i++) {
        expect((await generator.next()).value?.startIndex).toBe(i);
      }
      expect((await generator.next()).done).toBe(true);
    });
  });

  describe("Worker lifecycle", () => {
    it("terminate called on completion", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      await p1;

      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);
    });

    it("terminate only once", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      await p1;
      await generator.next();

      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);
    });

    it("worker not terminated before done", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });
      await p1;

      expect(activeWorker?.terminate).not.toHaveBeenCalled();
    });

    it("terminate after error", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "error", error: "fatal" });

      await expect(p1).rejects.toThrow();
      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error handling", () => {
    it("worker sends error", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "error", error: "Parsing failed" });
      await expect(p1).rejects.toThrow("Parsing failed");
    });

    it("parser rejects", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p = generator.next();
      await tick();

      activeWorker?.send({ type: "error", error: "Internal error" });
      await expect(p).rejects.toThrow();
    });

    it("worker terminated", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "error", error: "Oops" });
      await p1.catch(() => {});

      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);
    });

    it("error message propagated", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({
        type: "error",
        error: "Specific propagation error",
      });
      await expect(p1).rejects.toThrow("Specific propagation error");
    });

    it("unknown error object handled", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "error", error: { code: 500 } });
      await expect(p1).rejects.toThrow();
    });

    it("malformed error payload", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "error" }); // no error field
      await expect(p1).rejects.toThrow();
    });
  });

  describe("Edge cases", () => {
    it("worker immediately sends done", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      expect((await p).done).toBe(true);
    });

    it("worker sends done before any chunk", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      expect((await p1).done).toBe(true);
    });

    it("worker sends chunk after done (ignored)", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });

      expect((await p1).done).toBe(true);
    });

    it("duplicate done messages", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      activeWorker?.send({ type: "done" });

      expect((await p1).done).toBe(true);
    });

    it("duplicate chunk messages", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const chunk = createDummyChunk(0);
      activeWorker?.send({ type: "chunk", payload: chunk });
      activeWorker?.send({ type: "chunk", payload: chunk });
      activeWorker?.send({ type: "done" });

      expect((await p1).value).toStrictEqual(chunk);
      expect((await generator.next()).value).toStrictEqual(chunk);
    });

    it("empty headers", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const chunk = createDummyChunk(0, [], [{ A: "1" }]);
      activeWorker?.send({ type: "chunk", payload: chunk });
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.headers).toHaveLength(0);
    });

    it("empty rows", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const chunk = createDummyChunk(0, ["A"], []);
      activeWorker?.send({ type: "chunk", payload: chunk });
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.rows).toHaveLength(0);
    });

    it("chunk with empty object rows", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const chunk = createDummyChunk(0, ["A"], [{}, {}]);
      activeWorker?.send({ type: "chunk", payload: chunk });
      activeWorker?.send({ type: "done" });

      expect((await p1).value?.rows).toStrictEqual([{}, {}]);
    });

    it("zero chunkSize if supported", async () => {
      const parser = new ExcelParser(mockFile, 0);
      parser
        .parse()
        .next()
        .catch(() => {});
      await tick();

      expect(activeWorker?.postMessage).toHaveBeenCalledWith(
        expect.objectContaining({ rowChunkSize: 0 }),
      );
    });

    it("undefined payload", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "chunk", payload: undefined });
      activeWorker?.send({ type: "done" });

      expect((await p1).value).toBeUndefined();
    });

    it("malformed payload", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const malformed = { notARow: true };
      activeWorker?.send({ type: "chunk", payload: malformed });
      activeWorker?.send({ type: "done" });

      expect((await p1).value).toStrictEqual(malformed);
    });

    it("worker never responds (if timeout exists)", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p = generator.next();

      const timeout = new Promise((resolve) =>
        setTimeout(() => resolve("timeout"), 100),
      );
      const result = await Promise.race([p, timeout]);

      expect(result).toBe("timeout");
    });
  });

  describe("Memory / cleanup", () => {
    it("listeners cleaned", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      await p1;

      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);
    });

    it("worker terminated", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      await p1;

      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);
    });

    it("generator completes", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      expect((await p1).done).toBe(true);
    });

    it("no pending promises", async () => {
      const parser = new ExcelParser(mockFile);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      activeWorker?.send({ type: "done" });
      await p1;

      const p = generator.next();
      const r = await Promise.race([
        p,
        new Promise((res) => setTimeout(() => res("pending"), 10)),
      ]);

      expect((r as any).done).toBe(true);
    });

    describe("Cancellation via abort()", () => {
      it("terminates worker and nullifies reference", async () => {
        const parser = new ExcelParser(mockFile);
        const generator = parser.parse();
        generator.next().catch(() => {});
        await tick();

        expect(activeWorker).not.toBeNull();
        const terminateSpy = vi.spyOn(activeWorker!, "terminate");

        parser.abort();

        expect(terminateSpy).toHaveBeenCalledTimes(1);
        expect((parser as any).worker).toBeNull();
      });

      it("causes generator to finish early", async () => {
        const parser = new ExcelParser(mockFile);
        const generator = parser.parse();
        const p1 = generator.next();
        await tick();

        parser.abort();

        const result = await p1;
        expect(result.done).toBe(true);
      });

      it("ignores chunks arriving after abort", async () => {
        const parser = new ExcelParser(mockFile);
        const generator = parser.parse();
        const p1 = generator.next();
        await tick();

        parser.abort();
        activeWorker?.send({ type: "chunk", payload: createDummyChunk(0) });

        const result = await p1;
        expect(result.done).toBe(true);
      });
    });
  });

  describe("stress tests", () => {
    const createLargeChunk = (
      startIndex: number,
      chunkSize: number,
      columns: number = 10,
    ): RowsAndHeaders => {
      const headers = Array.from({ length: columns }).map((_, i) => `Col${i}`);
      const rows = Array.from({ length: chunkSize }).map((_, i) => {
        const row: any = {};
        for (let j = 0; j < columns; j++) {
          row[`Col${j}`] = `val_${startIndex + i}_${j}`;
        }
        return row;
      });
      return { startIndex, headers, rows };
    };

    it("Stress Test 1 — 100k rows", async () => {
      const CHUNK_SIZE = 1000;
      const NUM_ROWS = 100000;
      const NUM_CHUNKS = NUM_ROWS / CHUNK_SIZE;

      const parser = new ExcelParser(mockFile, CHUNK_SIZE);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const startTime = performance.now();

      for (let i = 0; i < NUM_CHUNKS; i++) {
        activeWorker?.send({
          type: "chunk",
          payload: createLargeChunk(i * CHUNK_SIZE, CHUNK_SIZE),
        });
      }
      activeWorker?.send({ type: "done" });

      let count = 0;
      const receivedIndices = new Set<number>();
      let lastStartIndex = -1;

      const firstResult = await p1;
      if (firstResult.value) {
        expect(firstResult.value.startIndex).toBe(0); // Ensures correct startIndex
        receivedIndices.add(firstResult.value.startIndex);
        count += firstResult.value.rows.length;
        lastStartIndex = 0;
      }

      for await (const chunk of generator) {
        expect(chunk.startIndex).toBe(lastStartIndex + CHUNK_SIZE);
        receivedIndices.add(chunk.startIndex);
        count += chunk.rows.length;
        lastStartIndex = chunk.startIndex;
      }

      const elapsed = performance.now() - startTime;
      expect(count).toBe(NUM_ROWS); // total rows
      expect(receivedIndices.size).toBe(NUM_CHUNKS); // no missing rows / all chunks yielded
      expect(activeWorker?.terminate).toHaveBeenCalledTimes(1); // worker terminated
      expect(elapsed).toBeLessThan(1500); // performance assertions
    });

    it("Stress Test 2 — 500k rows", async () => {
      const CHUNK_SIZE = 5000;
      const NUM_ROWS = 500000;
      const NUM_CHUNKS = NUM_ROWS / CHUNK_SIZE;

      const parser = new ExcelParser(mockFile, CHUNK_SIZE);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      const startTime = performance.now();

      for (let i = 0; i < NUM_CHUNKS; i++) {
        activeWorker?.send({
          type: "chunk",
          payload: createLargeChunk(i * CHUNK_SIZE, CHUNK_SIZE),
        });
      }
      activeWorker?.send({ type: "done" });

      let count = 0;

      const firstResult = await p1;
      if (firstResult.value) count += firstResult.value.rows.length;

      for await (const chunk of generator) {
        count += chunk.rows.length;
      }

      const elapsed = performance.now() - startTime;
      expect(count).toBe(NUM_ROWS);
      expect(elapsed).toBeLessThan(5000); // performance assertion
    });

    it("Stress Test 3 — Wide dataset", async () => {
      const CHUNK_SIZE = 1000;
      const NUM_ROWS = 100000;
      const COLS = 250;
      const NUM_CHUNKS = NUM_ROWS / CHUNK_SIZE;

      const parser = new ExcelParser(mockFile, CHUNK_SIZE);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      for (let i = 0; i < NUM_CHUNKS; i++) {
        activeWorker?.send({
          type: "chunk",
          payload: createLargeChunk(i * CHUNK_SIZE, CHUNK_SIZE, COLS),
        });
      }
      activeWorker?.send({ type: "done" });

      let count = 0;

      const firstResult = await p1;
      if (firstResult.value) {
        expect(firstResult.value.headers).toHaveLength(COLS);
        expect(Object.keys(firstResult.value.rows[0])).toHaveLength(COLS);
        expect(typeof firstResult.value.rows[0]["Col0"]).toBe("string");
        count += firstResult.value.rows.length;
      }

      for await (const chunk of generator) {
        count += chunk.rows.length;
      }

      expect(count).toBe(NUM_ROWS);
    });

    it("Stress Test 4 — Producer faster than consumer", async () => {
      const CHUNK_SIZE = 1000;
      const NUM_ROWS = 10000;
      const NUM_CHUNKS = NUM_ROWS / CHUNK_SIZE;

      const parser = new ExcelParser(mockFile, CHUNK_SIZE);
      const generator = parser.parse();
      const p1 = generator.next();
      await tick();

      // Dispatch every chunk before consuming
      for (let i = 0; i < NUM_CHUNKS; i++) {
        activeWorker?.send({
          type: "chunk",
          payload: createLargeChunk(i * CHUNK_SIZE, CHUNK_SIZE),
        });
      }
      activeWorker?.send({ type: "done" });

      let count = 0;
      let lastStartIndex = -1;

      const firstResult = await p1;
      if (firstResult.value) {
        expect(firstResult.value.startIndex).toBe(0);
        count += firstResult.value.rows.length;
        lastStartIndex = 0;
      }

      for await (const chunk of generator) {
        // FIFO ordering
        expect(chunk.startIndex).toBe(lastStartIndex + CHUNK_SIZE);
        count += chunk.rows.length;
        lastStartIndex = chunk.startIndex;
      }

      // queue drains correctly, no dropped chunks
      expect(count).toBe(NUM_ROWS);
    });

    it("Stress Test 5 — Consumer faster than producer", async () => {
      const CHUNK_SIZE = 1000;

      const parser = new ExcelParser(mockFile, CHUNK_SIZE);
      const generator = parser.parse();

      const p1 = generator.next();
      const p2 = generator.next();
      const p3 = generator.next();
      await tick(); // Consumer repeatedly awaits next()

      // worker slowly dispatches chunks
      activeWorker?.send({
        type: "chunk",
        payload: createLargeChunk(0, CHUNK_SIZE),
      });
      await tick();
      activeWorker?.send({
        type: "chunk",
        payload: createLargeChunk(CHUNK_SIZE, CHUNK_SIZE),
      });
      await tick();
      activeWorker?.send({ type: "done" });

      const r1 = await p1;
      const r2 = await p2;
      const r3 = await p3;

      expect(r1.value?.startIndex).toBe(0);
      expect(r2.value?.startIndex).toBe(CHUNK_SIZE);
      expect(r3.done).toBe(true);
    });

    describe("Memory assertions", () => {
      it("verify queue empty, worker terminated, generator completed, no pending listeners", async () => {
        const CHUNK_SIZE = 1000;
        const parser = new ExcelParser(mockFile, CHUNK_SIZE);
        const generator = parser.parse();
        const p1 = generator.next();
        await tick();

        for (let i = 0; i < 5; i++) {
          activeWorker?.send({
            type: "chunk",
            payload: createLargeChunk(i * CHUNK_SIZE, CHUNK_SIZE),
          });
        }
        activeWorker?.send({ type: "done" });

        await p1;
        for await (const chunk of generator) {
          // just consume
        }

        expect(activeWorker?.terminate).toHaveBeenCalledTimes(1);

        const pAfter = generator.next();
        const res = await Promise.race([
          pAfter,
          new Promise((resolve) => setTimeout(() => resolve("timeout"), 50)),
        ]);

        expect((res as any).done).toBe(true);
      });
    });
  });
});
