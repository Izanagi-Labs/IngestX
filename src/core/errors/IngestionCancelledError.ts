export class IngestionCancelledError extends Error {
  readonly code = "INGESTION_CANCELLED";

  constructor() {
    super("Ingestion cancelled.");

    this.name = "IngestionCancelledError";

    Object.setPrototypeOf(this, IngestionCancelledError.prototype);
  }
}

export function isIngestionCancelledError(
  error: any,
): error is IngestionCancelledError {
  return (
    error instanceof IngestionCancelledError ||
    (error && error.name === "IngestionCancelledError")
  );
}
