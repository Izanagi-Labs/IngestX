import { vi } from "vitest";

// Initialize a singleton worker scope
if (!(globalThis as any).workerScope) {
  (globalThis as any).workerScope = {
    currentMock: null,
    postMessage: (data: any) => {
      const mock = (globalThis as any).workerScope.currentMock;
      if (mock && mock.onmessage) {
        mock.onmessage({ data });
      }
    },
  };
  (globalThis as any).self = (globalThis as any).workerScope;
  // Evaluate the worker logic once
  require("../../src/core/parser/ExcelParser/excel.worker.ts");
}

// Mock the Vite worker import so it runs synchronously in Node
vi.mock("@/src/core/parser/ExcelParser/excel.worker.ts?worker&inline", () => {
  return {
    default: class MockWorker {
      onmessage: any;

      constructor() {
        // Attach this instance to the singleton scope
        (globalThis as any).workerScope.currentMock = this;
      }

      postMessage(data: any) {
        setTimeout(() => {
          if ((globalThis as any).workerScope.onmessage) {
            (globalThis as any).workerScope.onmessage({ data });
          }
        }, 0);
      }

      terminate() {
        if ((globalThis as any).workerScope.currentMock === this) {
          (globalThis as any).workerScope.currentMock = null;
        }
      }
    },
  };
});
