import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPostRequest, SERVICE_TIMEOUT_MS } from './screenshotService';

const POST_URL = 'https://www.linkedin.com/posts/someone_topic-share-7485528159346622464-sQj-';
const URN = 'urn:li:share:7485528159346622464';

const request = createPostRequest('/post-status', (response) => response.status);

describe('createPostRequest', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', 'https://screenshots.example.com');
    request.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('sends only the post URN to the service path', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(request.get(POST_URL)).resolves.toBe(200);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const parsed = new URL(url);
    expect(parsed.pathname).toBe('/post-status');
    expect([...parsed.searchParams.keys()]).toEqual(['urn']);
    expect(parsed.searchParams.get('urn')).toBe(URN);
    expect(init.body).toBeUndefined();
  });

  it('sends one request per post for the session', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    await Promise.all([request.get(POST_URL), request.get(POST_URL)]);
    await request.get(POST_URL);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('returns null after a timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        })
      )
    );

    const result = request.get(POST_URL);
    await vi.advanceTimersByTimeAsync(SERVICE_TIMEOUT_MS);
    await expect(result).resolves.toBeNull();
  });

  it('returns null on a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request.get(POST_URL)).resolves.toBeNull();
  });

  it('sends no request when the service URL is not set', async () => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(request.get(POST_URL)).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends no request when the post URL has no URN', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(request.get('https://www.linkedin.com/in/someone')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
