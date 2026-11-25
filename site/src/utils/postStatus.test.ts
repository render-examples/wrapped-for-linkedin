import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPostStatusCache, isPostPublic } from './postStatus';
import { SERVICE_TIMEOUT_MS } from './screenshotService';

const POST_URL = 'https://www.linkedin.com/feed/update/urn:li:activity:7273484794833833984';
const URN = 'urn:li:activity:7273484794833833984';

function assertOnlyUrn(call: unknown[]) {
  const [url, init] = call as [string, RequestInit];
  const parsed = new URL(url);
  expect([...parsed.searchParams.keys()]).toEqual(['urn']);
  expect(parsed.searchParams.get('urn')).toBe(URN);
  expect(parsed.pathname).toBe('/post-status');
  expect(init.body).toBeUndefined();
}

describe('isPostPublic', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', 'https://screenshots.example.com');
    clearPostStatusCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns true on a 200', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(isPostPublic(POST_URL)).resolves.toBe(true);
    assertOnlyUrn(fetchMock.mock.calls[0]);
  });

  it('returns false on a 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(isPostPublic(POST_URL)).resolves.toBe(false);
    assertOnlyUrn(fetchMock.mock.calls[0]);
  });

  it('returns null on another status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 500 })));
    await expect(isPostPublic(POST_URL)).resolves.toBeNull();
  });

  it('returns null after a timeout', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = isPostPublic(POST_URL);
    await vi.advanceTimersByTimeAsync(SERVICE_TIMEOUT_MS);
    await expect(result).resolves.toBeNull();
    assertOnlyUrn(fetchMock.mock.calls[0]);
  });

  it('returns null on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(isPostPublic(POST_URL)).resolves.toBeNull();
  });

  it('sends one request per post for the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([isPostPublic(POST_URL), isPostPublic(POST_URL)]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
