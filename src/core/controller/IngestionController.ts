import { IngestionStatus } from "./types";
import { IngestionCancelledError } from "../errors";

export class IngestionController {
  private status = IngestionStatus.Idle;

  private resumeResolver: (() => void) | null = null;
  private cancelListeners: (() => void)[] = [];

  onCancel(callback: () => void): void {
    this.cancelListeners.push(callback);
  }

  start(): void {
    this.status = IngestionStatus.Running;
  }

  pause(): void {
    if (this.status === IngestionStatus.Running) {
      this.status = IngestionStatus.Paused;
    }
  }

  resume(): void {
    if (this.status !== IngestionStatus.Paused) {
      return;
    }

    this.status = IngestionStatus.Running;

    this.resumeResolver?.();
    this.resumeResolver = null;
  }

  cancel(): void {
    if (
      this.status === IngestionStatus.Cancelled ||
      this.status === IngestionStatus.Completed
    ) {
      return;
    }
    
    this.status = IngestionStatus.Cancelled;

    for (const listener of this.cancelListeners) {
      try {
        listener();
      } catch (e) {
        console.error("Error in cancel listener", e);
      }
    }

    // Wake the processing loop if it's waiting.
    this.resumeResolver?.();
    this.resumeResolver = null;
  }

  async waitIfPaused(): Promise<void> {
    if (this.status !== IngestionStatus.Paused) {
      return;
    }

    await new Promise<void>((resolve) => {
      this.resumeResolver = resolve;
    });
  }

  throwIfCancelled(): void {
    if (this.status === IngestionStatus.Cancelled) {
      throw new IngestionCancelledError();
    }
  }

  getStatus(): IngestionStatus {
    return this.status;
  }

  get isRunning(): boolean {
    return this.status === IngestionStatus.Running;
  }

  get isPaused(): boolean {
    return this.status === IngestionStatus.Paused;
  }

  get isCancelled(): boolean {
    return this.status === IngestionStatus.Cancelled;
  }

  get isCompleted(): boolean {
    return this.status === IngestionStatus.Completed;
  }

  complete(): void {
    this.status = IngestionStatus.Completed;
  }

  fail(): void {
    this.status = IngestionStatus.Failed;
  }
}
