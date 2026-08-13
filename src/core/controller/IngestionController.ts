import { IngestionStatus } from "./types";
import { IngestionCancelledError } from "../errors";

export class IngestionController {
  private status = IngestionStatus.Idle;

  private resumeResolver: (() => void) | null = null;

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
    this.status = IngestionStatus.Cancelled;

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
}
