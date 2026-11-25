/**
 * Check with the screenshot service whether a LinkedIn post is public.
 * LinkedIn shows an error page inside the iframe for a post that is not public,
 * and the app cannot read inside the iframe.
 */

import { buildServiceRequestUrl, fetchWithTimeout } from '@utils/screenshotService';

// One request per post for the session, shared by the dashboard and the stories.
const cache = new Map<string, Promise<boolean | null>>();

async function requestPostStatus(url: string): Promise<boolean | null> {
  try {
    const response = await fetchWithTimeout(url);
    if (response.status === 200) {
      return true;
    }
    if (response.status === 404) {
      return false;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns true if the post is public, false if it is not, and null if the check failed.
 */
export function isPostPublic(postUrl: string): Promise<boolean | null> {
  const url = buildServiceRequestUrl('/post-status', postUrl);
  if (!url) {
    return Promise.resolve(null);
  }
  let pending = cache.get(url);
  if (!pending) {
    pending = requestPostStatus(url);
    cache.set(url, pending);
  }
  return pending;
}

/** Clear the session cache. Used by tests. */
export function clearPostStatusCache(): void {
  cache.clear();
}
