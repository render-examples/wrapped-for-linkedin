import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  clearPostImageCache,
  getPostImage,
  isPostImageDataUrl,
  MAX_POST_IMAGE_BYTES,
} from './postScreenshot';

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
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await expect(getPostImage(POST_URL)).resolves.toBe('data:image/png;base64,iVBORw==');
    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe('/post-image');
  });

  it('returns null on a 404', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 404 })));
    await expect(getPostImage(POST_URL)).resolves.toBeNull();
  });

  it('accepts a JPEG and ignores content-type parameters', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([255, 216, 255]), {
          status: 200,
          headers: { 'content-type': 'image/jpeg; charset=binary' },
        }),
      ),
    );
    await expect(getPostImage(POST_URL)).resolves.toBe('data:image/jpeg;base64,/9j/');
  });

  it.each(['image/svg+xml', 'text/html', 'image/png");background:url(x'])(
    'returns null for content-type %s',
    async (type) => {
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue(
          new Response(new Uint8Array([1, 2, 3]), {
            status: 200,
            headers: { 'content-type': type },
          }),
        ),
      );
      await expect(getPostImage(POST_URL)).resolves.toBeNull();
    },
  );

  it('returns null when the body is larger than the limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array(MAX_POST_IMAGE_BYTES + 1), {
          status: 200,
          headers: { 'content-type': 'image/png' },
        }),
      ),
    );
    await expect(getPostImage(POST_URL)).resolves.toBeNull();
  });
});

describe('isPostImageDataUrl', () => {
  it('accepts base64 PNG and JPEG data URLs', () => {
    expect(isPostImageDataUrl('data:image/png;base64,iVBORw==')).toBe(true);
    expect(isPostImageDataUrl('data:image/jpeg;base64,/9j/')).toBe(true);
  });

  it('rejects other types and characters that can end a CSS url()', () => {
    expect(isPostImageDataUrl('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(isPostImageDataUrl('data:image/png;base64,iVBO") , url("https://example.com/x')).toBe(
      false,
    );
    expect(isPostImageDataUrl('https://example.com/x.png')).toBe(false);
  });
});
