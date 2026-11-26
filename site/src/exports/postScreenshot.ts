/**
 * Get a screenshot of a LinkedIn post from the screenshot service.
 * The export uses it in place of the LinkedIn iframe, which the browser cannot capture.
 */

import { createPostRequest } from '@utils/screenshotService';

// The service returns a PNG of about 1 MB. Reject larger bodies.
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = ['image/png', 'image/jpeg'];

/**
 * Return true for a base64 PNG or JPEG data URL. The export puts the data URL in a CSS url(),
 * so other types and characters are not safe.
 */
export function isPostImageDataUrl(value: string): boolean {
  return /^data:image\/(png|jpeg);base64,[A-Za-z0-9+/]*={0,2}$/.test(value);
}

// Read the body in chunks. Stop and return null when it goes over MAX_POST_IMAGE_BYTES.
async function readLimitedBody(response: Response): Promise<Uint8Array | null> {
  if (!response.body) {
    return null;
  }
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    size += value.byteLength;
    if (size > MAX_POST_IMAGE_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function responseToDataUrl(response: Response): Promise<string | null> {
  if (!response.ok) {
    return null;
  }
  // Remove parameters such as "; charset=binary".
  const type = (response.headers.get('content-type') ?? '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.includes(type)) {
    return null;
  }
  const bytes = await readLimitedBody(response);
  if (!bytes) {
    return null;
  }
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:${type};base64,${btoa(binary)}`;
}

// One request per post for the session.
const postImage = createPostRequest('/post-image', responseToDataUrl);

/**
 * Get the post screenshot as a PNG or JPEG data URL.
 * Returns null if the post is not public, the response is not a PNG or JPEG, the response is too large,
 * the request times out, or the request fails.
 */
export function getPostImage(postUrl: string): Promise<string | null> {
  return postImage.get(postUrl);
}

/** Clear the session cache. Used by tests. */
export function clearPostImageCache(): void {
  postImage.clear();
}
