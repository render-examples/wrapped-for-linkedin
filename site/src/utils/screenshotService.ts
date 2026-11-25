/**
 * Client for the screenshot service.
 *
 * Privacy rule: the only value sent to the service is a post URN, for example
 * `urn:li:share:123`. Never add analytics data to these requests.
 */

import { getLinkedInPostUrn } from '@utils/linkedinEmbed';

export const SERVICE_TIMEOUT_MS = 10_000;

type ServicePath = '/post-status' | '/post-image';

/**
 * Build the request URL for a post URL. The URL has only a `urn` query parameter.
 * Returns null when the service URL is not set or the post URL has no URN.
 */
function buildServiceRequestUrl(path: ServicePath, postUrl: string): string | null {
  const serviceUrl = import.meta.env.VITE_SCREENSHOT_SERVICE_URL;
  const urn = getLinkedInPostUrn(postUrl);
  if (!serviceUrl || !urn) {
    return null;
  }
  const url = new URL(path, serviceUrl);
  url.search = new URLSearchParams({ urn }).toString();
  return url.toString();
}

/**
 * Send a GET request with no body. Abort it after SERVICE_TIMEOUT_MS.
 */
async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

interface PostRequest<T> {
  // Returns null when the service URL is not set, the request fails, or `read` returns null.
  get: (postUrl: string) => Promise<T | null>;
  // Clear the session cache. Used by tests.
  clear: () => void;
}

/**
 * Make a request to one service path that sends one request per post for the session.
 * `read` turns the response into a value. If it throws, the result is null.
 */
export function createPostRequest<T>(
  path: ServicePath,
  read: (response: Response) => T | null | Promise<T | null>
): PostRequest<T> {
  const cache = new Map<string, Promise<T | null>>();

  async function send(url: string): Promise<T | null> {
    try {
      return await read(await fetchWithTimeout(url));
    } catch {
      return null;
    }
  }

  return {
    get(postUrl) {
      const url = buildServiceRequestUrl(path, postUrl);
      if (!url) {
        return Promise.resolve(null);
      }
      let pending = cache.get(url);
      if (!pending) {
        pending = send(url);
        cache.set(url, pending);
      }
      return pending;
    },
    clear() {
      cache.clear();
    },
  };
}
