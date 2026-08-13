import { vi } from "vitest";

export class MockWorker implements Worker {
  public onmessage: ((this: Worker, ev: MessageEvent) => any) | null = null;
  public onmessageerror: ((this: Worker, ev: MessageEvent) => any) | null =
    null;
  public onerror: ((this: AbstractWorker, ev: ErrorEvent) => any) | null = null;

  public terminate = vi.fn();
  public postMessage = vi.fn();
  public addEventListener = vi.fn();
  public removeEventListener = vi.fn();
  public dispatchEvent = vi.fn();

  constructor(stringUrl: string | URL, options?: WorkerOptions) {}

  // Helper for tests to simulate worker sending a message back
  public send(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent("message", { data }));
    }
  }

  // Helper for tests to simulate worker throwing an error
  public triggerError(error: Error) {
    if (this.onerror) {
      this.onerror(new ErrorEvent("error", { error }));
    }
  }
}
