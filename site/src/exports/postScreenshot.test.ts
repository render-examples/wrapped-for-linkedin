import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPostImageCache, getPostImage } from './postScreenshot';
import { SERVICE_TIMEOUT_MS } from '@utils/screenshotService';

const POST_URL = 'https://www.linkedin.com/posts/someone_topic-share-7485528159346622464-sQj-';
const URN = 'urn:li:share:7485528159346622464';

function assertOnlyUrn(call: unknown[]) {
  const [url, init] = call as [string, RequestInit];
  const parsed = new URL(url);
  expect([...parsed.searchParams.keys()]).toEqual(['urn']);
  expect(parsed.searchParams.get('urn')).toBe(URN);
  expect(parsed.pathname).toBe('/post-image');
  expect(init.body).toBeUndefined();
}

describe('getPostImage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', 'https://screenshots.example.com');
    clearPostImageCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('returns a PNG data URL on success', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPostImage(POST_URL)).resolves.toBe('data:image/png;base64,iVBORw==');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    assertOnlyUrn(fetchMock.mock.calls[0]);
  });

  it('sends one request per post for the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Uint8Array([1]), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await getPostImage(POST_URL);
    await getPostImage(POST_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null on a 404', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPostImage(POST_URL)).resolves.toBeNull();
    assertOnlyUrn(fetchMock.mock.calls[0]);
  });

  it('returns null after a timeout', async () => {
    vi.useFakeTimers();
    const fetchMock = vi.fn((_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = getPostImage(POST_URL);
    await vi.advanceTimersByTimeAsync(SERVICE_TIMEOUT_MS);
    await expect(result).resolves.toBeNull();
    assertOnlyUrn(fetchMock.mock.calls[0]);
  });

  it('returns null on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(getPostImage(POST_URL)).resolves.toBeNull();
  });

  it('sends no request when the service URL is not set', async () => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPostImage(POST_URL)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
