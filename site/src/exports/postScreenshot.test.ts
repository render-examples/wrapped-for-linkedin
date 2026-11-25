import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearPostImageCache, getPostImage } from './postScreenshot';

// screenshotService.test.ts covers the request, the session cache, and the failure cases.
const POST_URL = 'https://www.linkedin.com/posts/someone_topic-share-7485528159346622464-sQj-';

describe('getPostImage', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_SCREENSHOT_SERVICE_URL', 'https://screenshots.example.com');
    clearPostImageCache();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('returns a PNG data URL from /post-image', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: { 'content-type': 'image/png' },
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPostImage(POST_URL)).resolves.toBe('data:image/png;base64,iVBORw==');
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/post-image');
  });

  it('returns null on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(getPostImage(POST_URL)).resolves.toBeNull();
  });
});
