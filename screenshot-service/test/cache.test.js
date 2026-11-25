import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../src/cache.js';

describe('TtlCache', () => {
  it('expires entries after the time to live', () => {
    let now = 0;
    const cache = new TtlCache({ ttlMs: 100, maxEntries: 10, now: () => now });
    cache.set('a', 1);
    now = 99;
    assert.equal(cache.get('a'), 1);
    now = 100;
    assert.equal(cache.get('a'), undefined);
  });

  it('removes the oldest entry when full', () => {
    const cache = new TtlCache({ ttlMs: 1000, maxEntries: 2 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 2);
    assert.equal(cache.get('c'), 3);
  });
});
