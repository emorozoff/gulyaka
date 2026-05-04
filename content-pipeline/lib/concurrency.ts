/**
 * Tiny semaphore for limiting in-flight async tasks.
 * No external deps; no overkill.
 */

export function createLimiter(maxInFlight: number) {
  let inFlight = 0;
  const queue: Array<() => void> = [];

  function acquire(): Promise<void> {
    if (inFlight < maxInFlight) {
      inFlight++;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      queue.push(() => {
        inFlight++;
        resolve();
      });
    });
  }

  function release() {
    inFlight--;
    const next = queue.shift();
    if (next) next();
  }

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    await acquire();
    try {
      return await task();
    } finally {
      release();
    }
  };
}
