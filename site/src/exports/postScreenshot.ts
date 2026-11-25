/**
 * Get a screenshot of a LinkedIn post from the screenshot service.
 * The export uses it in place of the LinkedIn iframe, which the browser cannot capture.
 */

import { buildServiceRequestUrl, fetchWithTimeout } from '@utils/screenshotService';

// One request per post for the session.
const cache = new Map<string, Promise<string | null>>();

async function responseToDataUrl(response: Response): Promise<string> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const type = response.headers.get('content-type') || 'image/png';
  return `data:${type};base64,${btoa(binary)}`;
}

async function requestPostImage(url: string): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return null;
    }
    return await responseToDataUrl(response);
  } catch {
    return null;
  }
}

/**
 * Get the post screenshot as a PNG data URL.
 * Returns null if the post is not public, the request times out, or the request fails.
 */
export function getPostImage(postUrl: string): Promise<string | null> {
  const url = buildServiceRequestUrl('/post-image', postUrl);
  if (!url) {
    return Promise.resolve(null);
  }
  let pending = cache.get(url);
  if (!pending) {
    pending = requestPostImage(url);
    cache.set(url, pending);
  }
  return pending;
}

/** Clear the session cache. Used by tests. */
export function clearPostImageCache(): void {
  cache.clear();
}
