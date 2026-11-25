/**
 * Get a screenshot of a LinkedIn post from the screenshot service.
 * The export uses it in place of the LinkedIn iframe, which the browser cannot capture.
 */

import { createPostRequest } from '@utils/screenshotService';

async function responseToDataUrl(response: Response): Promise<string | null> {
  if (!response.ok) {
    return null;
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const type = response.headers.get('content-type') || 'image/png';
  return `data:${type};base64,${btoa(binary)}`;
}

// One request per post for the session.
const postImage = createPostRequest('/post-image', responseToDataUrl);

/**
 * Get the post screenshot as a PNG data URL.
 * Returns null if the post is not public, the request times out, or the request fails.
 */
export function getPostImage(postUrl: string): Promise<string | null> {
  return postImage.get(postUrl);
}

/** Clear the session cache. Used by tests. */
export function clearPostImageCache(): void {
  postImage.clear();
}
