const EMBED_BASE = 'https://www.linkedin.com/embed/feed/update/';
const URN_PATTERN = /urn:li:(activity|share|ugcPost):(\d+)/;
const SLUG_PATTERN = /-(activity|share|ugcPost)-(\d+)/;

const decode = (url: string): string => {
  try {
    return decodeURIComponent(url);
  } catch {
    return url;
  }
};

/**
 * Get the post URN, for example `urn:li:share:123`, from a post URL in the analytics export.
 * Old exports use `/feed/update/urn:li:<type>:<id>` URLs.
 * New exports use `/posts/<slug>-<type>-<id>-<suffix>` URLs.
 * Returns null when the URL does not contain a post ID.
 */
export function getLinkedInPostUrn(postUrl: string): string | null {
  const cleanUrl = decode(postUrl.split('?')[0]);
  const match = cleanUrl.match(URN_PATTERN) ?? cleanUrl.match(SLUG_PATTERN);
  if (!match) {
    return null;
  }
  const [, type, id] = match;
  return `urn:li:${type}:${id}`;
}

/**
 * Get the LinkedIn embed URL for a post URL from the analytics export.
 * Returns null when the URL does not contain a post ID.
 */
export function getLinkedInEmbedUrl(postUrl: string): string | null {
  const urn = getLinkedInPostUrn(postUrl);
  return urn ? `${EMBED_BASE}${urn}` : null;
}
