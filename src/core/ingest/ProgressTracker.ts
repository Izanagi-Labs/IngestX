import { Progress, ProgressBasis } from "./types";

export class ProgressTracker {
  private phase: Progress["phase"] = "initializing";
  private processedRows = 0;
  private totalRows?: number;
  private processedBytes?: number;
  private totalBytes?: number;
  private percentage?: number;
  private basis: ProgressBasis;
  private isTerminal = false;

  constructor(
    private readonly onProgress: ((progress: Progress) => void) | undefined,
    file: File,
  ) {
    const fileName = (file && typeof file.name === "string") ? file.name : "";
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      this.basis = "bytes";
      this.totalBytes = file.size;
      this.processedBytes = 0;
      this.percentage = 0;
    } else if (ext === "xlsx" || ext === "xls") {
      this.basis = "rows";
      this.percentage = 0;
    } else {
      this.basis = "indeterminate";
    }
  }

  private emit(): void {
    if (!this.onProgress) return;
    this.onProgress(this.getSnapshot());
  }

  public getSnapshot(): Progress {
    return {
      phase: this.phase,
      processedRows: this.processedRows,
      totalRows: this.totalRows,
      processedBytes: this.processedBytes,
      totalBytes: this.totalBytes,
      percentage: this.percentage,
      basis: this.basis,
    };
  }

  public setPhase(phase: Progress["phase"]): void {
    if (this.isTerminal) return;

    this.phase = phase;

    if (
      phase === "completed" ||
      phase === "cancelled" ||
      phase === "failed"
    ) {
      this.isTerminal = true;
      if (phase === "completed") {
        this.percentage = 1;
        if (this.basis === "bytes" && this.totalBytes !== undefined) {
          this.processedBytes = this.totalBytes;
        }
      }
    }

    this.emit();
  }

  public updateFromChunk(
    processedRowsInChunk: number,
    progressPercentage: number,
    processedBytes?: number,
    totalRows?: number,
  ): void {
    if (this.isTerminal) return;

    this.processedRows += processedRowsInChunk;

    if (this.basis === "bytes" && processedBytes !== undefined) {
      this.processedBytes = processedBytes;
      if (this.totalBytes && this.totalBytes > 0) {
        this.percentage = Math.min(1, this.processedBytes / this.totalBytes);
      }
    } else if (this.basis === "rows") {
      if (totalRows !== undefined) {
        this.totalRows = totalRows;
      }
      this.percentage = Math.min(1, progressPercentage);
    } else {
      this.percentage = undefined;
    }

    this.emit();
  }
}
