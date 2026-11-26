import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPostStatusCache, isPostPublic } from './postStatus';

// screenshotService.test.ts covers the request, the session cache, and the failure cases.
const POST_URL = 'https://www.linkedin.com/feed/update/urn:li:activity:7273484794833833984';

function respondWith(status: number) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('isPostPublic', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', 'https://screenshots.example.com');
    clearPostStatusCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('requests /post-status', async () => {
    const fetchMock = respondWith(200);
    await isPostPublic(POST_URL);
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/post-status');
  });

  it('returns true on a 200', async () => {
    respondWith(200);
    await expect(isPostPublic(POST_URL)).resolves.toBe(true);
  });

  it('returns false on a 404', async () => {
    respondWith(404);
    await expect(isPostPublic(POST_URL)).resolves.toBe(false);
  });

  it('returns null on another status', async () => {
    respondWith(500);
    await expect(isPostPublic(POST_URL)).resolves.toBeNull();
  });
});
