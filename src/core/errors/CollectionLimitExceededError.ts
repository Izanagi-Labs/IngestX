export class CollectionLimitExceededError extends Error {
  constructor(public readonly maxCollectedRows: number) {
    super(
      `Memory limit exceeded: maxCollectedRows (${maxCollectedRows}) reached.`,
    );

    this.name = "CollectionLimitExceededError";

    Object.setPrototypeOf(this, CollectionLimitExceededError.prototype);
  }
}
