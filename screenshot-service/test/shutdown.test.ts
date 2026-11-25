import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createShutdown } from '../src/shutdown.ts';

/** A fake server whose close callback the test calls by hand. */
function fakeServer() {
  const state = { closeCalls: 0, finishClose: () => {} };
  return {
    state,
    server: {
      close(callback: () => void) {
        state.closeCalls++;
        state.finishClose = callback;
      },
    },
  };
}

const tick = () => new Promise((resolve) => setImmediate(resolve));

describe('createShutdown', () => {
  it('exits only after the server closes', async () => {
    const { state, server } = fakeServer();
    const exits: number[] = [];
    const shutdown = createShutdown({
      server,
      closeBrowser: async () => {},
      exit: (code) => exits.push(code),
      timeoutMs: 1000,
    });
    shutdown();
    await tick();
    assert.deepEqual(exits, []);
    state.finishClose();
    await tick();
    assert.deepEqual(exits, [0]);
  });

  it('ignores a second signal', async () => {
    const { state, server } = fakeServer();
    const exits: number[] = [];
    let browserCloses = 0;
    const shutdown = createShutdown({
      server,
      closeBrowser: async () => {
        browserCloses++;
      },
      exit: (code) => exits.push(code),
      timeoutMs: 1000,
    });
    shutdown();
    shutdown();
    state.finishClose();
    await tick();
    assert.equal(state.closeCalls, 1);
    assert.equal(browserCloses, 1);
    assert.deepEqual(exits, [0]);
  });

  it('exits with code 1 when the server does not close in time', async () => {
    const { server } = fakeServer();
    const exits: number[] = [];
    const shutdown = createShutdown({
      server,
      closeBrowser: async () => {},
      exit: (code) => exits.push(code),
      timeoutMs: 10,
    });
    shutdown();
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.deepEqual(exits, [1]);
  });
});
