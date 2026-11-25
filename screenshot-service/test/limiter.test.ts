import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { LimiterBusyError, createLimiter } from '../src/limiter.ts';

/** A promise that the test resolves by hand. */
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { promise, resolve };
}

/** Count how many tasks run at the same time. */
function tracker() {
  let active = 0;
  const state = { max: 0, order: [] as string[] };
  const task = (name: string, done: Promise<void>) => async () => {
    active++;
    state.max = Math.max(state.max, active);
    state.order.push(name);
    await done;
    active--;
  };
  return { state, task };
}

describe('createLimiter', () => {
  it('runs at most `limit` tasks at the same time', async () => {
    const run = createLimiter({ limit: 2, maxQueue: 10, queueTimeoutMs: 1000 });
    const { state, task } = tracker();
    const gates = [deferred(), deferred(), deferred(), deferred()];
    const runs = gates.map((gate, i) => run(task(String(i), gate.promise)));
    gates.forEach((gate) => gate.resolve());
    await Promise.all(runs);
    assert.equal(state.max, 2);
  });

  it('does not let a new task take the slot of a queued task', async () => {
    const run = createLimiter({ limit: 1, maxQueue: 10, queueTimeoutMs: 1000 });
    const { state, task } = tracker();
    const first = deferred();
    const second = deferred();
    const third = deferred();

    // The first task returns this promise, so the limiter waits on it before this test does.
    const firstTask = first.promise.then(() => {});
    const runs = [
      run(() => {
        state.order.push('first');
        return firstTask;
      }),
      run(task('second', second.promise)),
    ];
    // Start a third task just after the limiter releases the first slot.
    firstTask.then(() => runs.push(run(task('third', third.promise))));
    first.resolve();
    await new Promise((resolve) => setImmediate(resolve));

    assert.equal(state.max, 1);
    assert.deepEqual(state.order, ['first', 'second']);
    second.resolve();
    third.resolve();
    await Promise.all(runs);
    assert.deepEqual(state.order, ['first', 'second', 'third']);
  });

  it('rejects a task when the queue is full', async () => {
    const run = createLimiter({ limit: 1, maxQueue: 1, queueTimeoutMs: 1000 });
    const gate = deferred();
    const running = run(() => gate.promise);
    const queued = run(async () => 'queued');
    await assert.rejects(run(async () => 'rejected'), LimiterBusyError);
    gate.resolve();
    await running;
    assert.equal(await queued, 'queued');
  });

  it('rejects a queued task after the wait timeout and frees its queue place', async () => {
    const run = createLimiter({ limit: 1, maxQueue: 1, queueTimeoutMs: 10 });
    const gate = deferred();
    const running = run(() => gate.promise);
    await assert.rejects(run(async () => 'late'), LimiterBusyError);
    const queued = run(async () => 'queued');
    gate.resolve();
    await running;
    assert.equal(await queued, 'queued');
  });
});
