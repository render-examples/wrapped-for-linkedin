import { useEffect, useState } from 'react';
import { isPostPublic } from '@utils/postStatus';

/**
 * Check whether a post is public.
 * Returns undefined while the check runs, then true, false, or null if the check failed.
 */
export function usePostStatus(postUrl: string | undefined): boolean | null | undefined {
  const [status, setStatus] = useState<{ url: string; value: boolean | null } | null>(null);

  useEffect(() => {
    if (!postUrl) {
      return;
    }
    let cancelled = false;
    isPostPublic(postUrl).then((value) => {
      if (!cancelled) {
        setStatus({ url: postUrl, value });
      }
    });
    return () => {
      cancelled = true;
    };
  }, [postUrl]);

  if (!postUrl) {
    return null;
  }
  return status?.url === postUrl ? status.value : undefined;
}
