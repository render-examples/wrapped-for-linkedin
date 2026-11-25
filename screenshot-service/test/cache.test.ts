import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TtlCache } from '../src/cache.ts';

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

  it('removes the oldest entries when the total size is over the limit', () => {
    const cache = new TtlCache<string>({
      ttlMs: 1000,
      maxEntries: 10,
      maxSize: 10,
      sizeOf: (value) => value.length,
    });
    cache.set('a', 'aaaa');
    cache.set('b', 'bbbb');
    cache.set('c', 'cccc');
    assert.equal(cache.get('a'), undefined);
    assert.equal(cache.get('b'), 'bbbb');
    assert.equal(cache.get('c'), 'cccc');
  });

  it('counts the size of a replaced entry only once', () => {
    const cache = new TtlCache<string>({
      ttlMs: 1000,
      maxEntries: 10,
      maxSize: 10,
      sizeOf: (value) => value.length,
    });
    cache.set('a', 'aaaa');
    cache.set('b', 'bbbb');
    cache.set('b', 'bbbb');
    assert.equal(cache.get('a'), 'aaaa');
  });

  it('does not keep an entry that is larger than the limit', () => {
    const cache = new TtlCache<string>({
      ttlMs: 1000,
      maxEntries: 10,
      maxSize: 3,
      sizeOf: (value) => value.length,
    });
    cache.set('a', 'aaaa');
    assert.equal(cache.get('a'), undefined);
  });
});
