// A global declaration for the experimental scheduler API if present
declare global {
  interface Window {
    scheduler?: {
      yield(): Promise<void>;
    };
  }
}

/**
 * Cooperatively yields control to the browser's event loop.
 * This allows the browser to process UI renders, click events, and other
 * macrotasks between heavy synchronous validation chunks.
 *
 * It prefers the modern `scheduler.yield()` API if available, which puts
 * the continuation at the front of the queue, and falls back to a 0ms setTimeout
 * which puts it at the back of the macrotask queue.
 */
export async function cooperativeYield(): Promise<void> {
  if (
    typeof window !== "undefined" &&
    typeof window.scheduler !== "undefined" &&
    typeof window.scheduler.yield === "function"
  ) {
    await window.scheduler.yield();
    return;
  }

  // Fallback to setTimeout macrotask
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
}
