/**
 * Check with the screenshot service whether a LinkedIn post is public.
 * LinkedIn shows an error page inside the iframe for a post that is not public,
 * and the app cannot read inside the iframe.
 */

import { createPostRequest } from '@utils/screenshotService';

// One request per post for the session, shared by the dashboard and the stories.
const postStatus = createPostRequest('/post-status', (response) => {
  if (response.status === 200) {
    return true;
  }
  if (response.status === 404) {
    return false;
  }
  return null;
});

/**
 * Returns true if the post is public, false if it is not, and null if the check failed.
 */
export function isPostPublic(postUrl: string): Promise<boolean | null> {
  return postStatus.get(postUrl);
}

/** Clear the session cache. Used by tests. */
export function clearPostStatusCache(): void {
  postStatus.clear();
}
