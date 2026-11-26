type LimiterOptions = {
  // The maximum number of tasks that run at the same time.
  limit: number;
  // The maximum number of tasks that wait for a slot.
  maxQueue: number;
  // How long a task waits for a slot before it is rejected.
  queueTimeoutMs: number;
};

/** The queue is full, or a task waited too long for a slot. */
export class LimiterBusyError extends Error {
  constructor() {
    super('Limiter is busy');
    this.name = 'LimiterBusyError';
  }
}

/**
 * Run at most `limit` tasks at the same time.
 * Other tasks wait and start in the order they arrived.
 */
export function createLimiter({ limit, maxQueue, queueTimeoutMs }: LimiterOptions) {
  let active = 0;
  const queue: Array<() => void> = [];

  const acquire = (): Promise<void> => {
    if (active < limit) {
      active++;
      return Promise.resolve();
    }
    if (queue.length >= maxQueue) {
      return Promise.reject(new LimiterBusyError());
    }
    return new Promise((resolve, reject) => {
      const start = () => {
        clearTimeout(timer);
        resolve();
      };
      const timer = setTimeout(() => {
        queue.splice(queue.indexOf(start), 1);
        reject(new LimiterBusyError());
      }, queueTimeoutMs);
      queue.push(start);
    });
  };

  // Give the slot straight to the next waiting task, so a new task cannot take it first.
  const release = () => {
    const next = queue.shift();
    if (next) {
      next();
    } else {
      active--;
    }
  };

  return async function run<T>(task: () => Promise<T>): Promise<T> {
    await acquire();
    try {
      return await task();
    } finally {
      release();
    }
  };
}
