/**
 * Client for the screenshot service.
 *
 * Privacy rule: the only value sent to the service is a post URN, for example
 * `urn:li:share:123`. Never add analytics data to these requests.
 */

import { getLinkedInPostUrn } from '@utils/linkedinEmbed';

export const SERVICE_TIMEOUT_MS = 10_000;

/**
 * Build the request URL for a post URL. The URL has only a `urn` query parameter.
 * Returns null when the service URL is not set or the post URL has no URN.
 */
export function buildServiceRequestUrl(
  path: '/post-status' | '/post-image',
  postUrl: string,
  serviceUrl: string | undefined = import.meta.env.VITE_SCREENSHOT_SERVICE_URL
): string | null {
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
export async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);
  try {
    return await fetch(url, { method: 'GET', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
