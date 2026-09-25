import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIngest } from "../../src/react";
import { IngestionStatus } from "../../src/index";
import { ix } from "../../src/model/ix";
import { generateCSV } from "../e2e/fixtures";

describe("useIngest Hook", () => {
  const columns = [
    { key: "name", name: "name", schema: ix.string() },
    { key: "age", name: "age", schema: ix.number() },
  ];

  it("should have correct initial state", () => {
    const { result } = renderHook(() => useIngest());

    expect(result.current.status).toBe(IngestionStatus.Idle);
    expect(result.current.progress).toBeNull();
    expect(result.current.result).toBeNull();
    expect(result.current.error).toBeNull();
  });
  it("should support pause and resume", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;
    let chunksProcessed = 0;

    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        onChunkProcessed: () => {
          chunksProcessed++;
          if (chunksProcessed === 2) {
            result.current.pause();
          }
        },
      });
    });

    // Wait until pause takes effect
    await new Promise((resolve) => setTimeout(resolve, 50));
    
    expect(result.current.status).toBe(IngestionStatus.Paused);

    act(() => {
      result.current.resume();
    });

    expect(result.current.status).toBe(IngestionStatus.Running);

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
  });

  it("should safely ignore repeated pause and resume calls", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(10).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    act(() => {
      result.current.pause(); // Idle -> pause (safe no-op)
    });

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 5,
        onChunkProcessed: () => {
          result.current.pause();
          result.current.pause(); // Repeated pause
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.status).toBe(IngestionStatus.Paused);

    act(() => {
      result.current.resume();
      result.current.resume(); // Repeated resume
    });

    await act(async () => {
      await promise;
    });

    act(() => {
      result.current.resume(); // Completed -> resume (safe no-op)
      result.current.pause(); // Completed -> pause (safe no-op)
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
  });

  it("should allow cancellation while paused", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;

    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        onChunkProcessed: () => {
          result.current.pause();
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.status).toBe(IngestionStatus.Paused);

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Cancelled);
  });

  it("should reject new ingestions while paused", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;

    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        onChunkProcessed: () => {
          result.current.pause();
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.status).toBe(IngestionStatus.Paused);

    let secondPromise: Promise<void>;
    act(() => {
      secondPromise = result.current.ingest({ file, columns });
    });

    await expect(secondPromise!).rejects.toThrow("An ingestion is already in progress");

    act(() => {
      result.current.cancel();
    });

    await act(async () => {
      await promise;
    });
  });

  it("should cancel on unmount when paused", async () => {
    const { result, unmount } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;

    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        onChunkProcessed: () => {
          result.current.pause();
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.status).toBe(IngestionStatus.Paused);

    unmount();

    await act(async () => {
      await promise;
    });

    expect(true).toBe(true); // Should not throw unhandled rejection
  });

  it("should reset state safely from completed", async () => {
    const { result } = renderHook(() => useIngest());
    const file = generateCSV(["name", "age"], [["Alice", 30]]);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({ file, columns, collectResults: true });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
    expect(result.current.result).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(IngestionStatus.Idle);
    expect(result.current.result).toBeNull();
  });

  it("should reset state safely while running", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({ file, columns });
    });

    expect(result.current.status).toBe(IngestionStatus.Running);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(IngestionStatus.Idle);

    await act(async () => {
      await promise;
    });

    // Still idle, no late resolve updates
    expect(result.current.status).toBe(IngestionStatus.Idle);
  });

  it("should reset state safely while paused", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        onChunkProcessed: () => {
          result.current.pause();
        },
      });
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.status).toBe(IngestionStatus.Paused);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(IngestionStatus.Idle);

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Idle);
  });

  it("should support streaming without memory accumulation", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(50).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let processedChunks = 0;

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        collectResults: false,
        onChunkProcessed: (chunk) => {
          processedChunks++;
          expect(chunk.output.validRows.length).toBeGreaterThan(0);
        },
      });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
    expect(processedChunks).toBe(5); // 50 rows / 10 chunkSize = 5 chunks

    // Verify memory was not accumulated
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.validRowsCount).toBe(50);
    expect(result.current.result?.validRows.length).toBe(0);
  });
  it("should successfully ingest and update state", async () => {
    const { result } = renderHook(() => useIngest());
    const file = generateCSV(
      ["name", "age"],
      [
        ["Alice", 30],
        ["Bob", 25],
      ],
    );
    console.log("FILE:", file, typeof file.name, file.name);

    await act(async () => {
      await result.current.ingest({
        file,
        columns,
        collectResults: true,
      });
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
    expect(result.current.error).toBeNull();
    expect(result.current.result).not.toBeNull();
    expect(result.current.result?.validRowsCount).toBe(2);
    expect(result.current.progress?.phase).toBe("completed");
  });

  it("should fail gracefully and set error state", async () => {
    const { result } = renderHook(() => useIngest());
    // Missing required column in the CSV will trigger a HeaderMismatchError
    const file = generateCSV(["name", "unknown"], [["Alice", 30]]);

    await act(async () => {
      await result.current.ingest({
        file,
        columns,
        collectResults: true,
      });
    });

    expect(result.current.status).toBe(IngestionStatus.Failed);
    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.type).toBe("HEADER_MISMATCH");
    expect(result.current.result).not.toBeNull(); // Still returns output object
  });

  it("should support cancellation", async () => {
    const { result } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;

    act(() => {
      promise = result.current.ingest({
        file,
        columns,
        chunkSize: 10,
        onChunkProcessed: () => {
          result.current.cancel();
        },
      });
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Cancelled);
    expect(result.current.error).toBeNull();
  });

  it("should explicitly reject rapid concurrent ingestion calls", async () => {
    const { result } = renderHook(() => useIngest());
    const file = generateCSV(
      ["name", "age"],
      [
        ["Alice", 30],
        ["Bob", 25],
      ],
    );

    let firstPromise: Promise<void>;
    let secondPromise: Promise<void>;

    act(() => {
      firstPromise = result.current.ingest({ file, columns });
    });

    act(() => {
      secondPromise = result.current.ingest({ file, columns });
    });

    await expect(secondPromise!).rejects.toThrow(
      "An ingestion is already in progress",
    );

    await act(async () => {
      await firstPromise;
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
  });

  it("should handle rapid cancellation safely", async () => {
    const { result } = renderHook(() => useIngest());
    const file = generateCSV(
      ["name", "age"],
      [
        ["Alice", 30],
        ["Bob", 25],
      ],
    );

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({ file, columns });
      result.current.cancel();
      result.current.cancel(); // idempotent
      result.current.cancel(); // idempotent
    });

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Cancelled);
    expect(result.current.error).toBeNull();
  });

  it("should reset state between re-ingestion", async () => {
    const { result } = renderHook(() => useIngest());
    const badFile = generateCSV(["wrong"], [[1]]);
    const goodFile = generateCSV(["name", "age"], [["Alice", 30]]);

    // 1. Fail first
    await act(async () => {
      await result.current.ingest({ file: badFile, columns });
    });
    expect(result.current.status).toBe(IngestionStatus.Failed);
    expect(result.current.error).not.toBeNull();

    // 2. Succeed next
    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({
        file: goodFile,
        columns,
        collectResults: true,
      });
    });

    // Immediately after starting, it should be running and error cleared
    expect(result.current.status).toBe(IngestionStatus.Running);
    expect(result.current.error).toBeNull();

    await act(async () => {
      await promise;
    });

    expect(result.current.status).toBe(IngestionStatus.Completed);
    expect(result.current.result?.validRowsCount).toBe(1);
  });

  it("should cancel automatically on unmount", async () => {
    const { result, unmount } = renderHook(() => useIngest());
    const rows = Array(100).fill(["A", 1]);
    const file = generateCSV(["name", "age"], rows);

    let promise: Promise<void>;
    act(() => {
      promise = result.current.ingest({ file, columns });
    });

    // Unmount before it finishes
    unmount();

    await act(async () => {
      await promise;
    });

    // We can't easily assert the hook state because it unmounted,
    // but the promise shouldn't throw an unhandled rejection,
    // and no React "state update on unmounted component" errors should appear in console.
    expect(true).toBe(true);
  });
});
