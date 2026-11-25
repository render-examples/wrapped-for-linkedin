/**
 * Run at most `limit` tasks at the same time. Other tasks wait in order.
 * @param {number} limit
 */
export function createLimiter(limit) {
  let active = 0;
  /** @type {Array<() => void>} */
  const queue = [];

  const next = () => {
    active--;
    queue.shift()?.();
  };

  /**
   * @template T
   * @param {() => Promise<T>} task
   * @returns {Promise<T>}
   */
  return async function run(task) {
    if (active >= limit) {
      await new Promise((resolve) => queue.push(() => resolve(undefined)));
    }
    active++;
    try {
      return await task();
    } finally {
      next();
    }
  };
}
