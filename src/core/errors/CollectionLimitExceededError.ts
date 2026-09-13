export class CollectionLimitExceededError extends Error {
  readonly code = "COLLECTION_LIMIT_EXCEEDED";

  constructor(public readonly maxCollectedRows: number) {
    super(
      `Memory limit exceeded: maxCollectedRows (${maxCollectedRows}) reached.`,
    );

    this.name = "CollectionLimitExceededError";

    Object.setPrototypeOf(this, CollectionLimitExceededError.prototype);
  }
}

export function isCollectionLimitExceededError(
  error: any,
): error is CollectionLimitExceededError {
  return (
    error instanceof CollectionLimitExceededError ||
    (error && error.name === "CollectionLimitExceededError")
  );
}
