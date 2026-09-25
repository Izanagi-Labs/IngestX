export class IngestionCancelledError extends Error {
  constructor() {
    super("Ingestion cancelled.");

    this.name = "IngestionCancelledError";

    Object.setPrototypeOf(this, IngestionCancelledError.prototype);
  }
}

export function isIngestionCancelledError(
  error: unknown,
): error is IngestionCancelledError {
  return Boolean(
    error instanceof IngestionCancelledError ||
    (error && (error as { name?: string }).name === "IngestionCancelledError")
  );
}
