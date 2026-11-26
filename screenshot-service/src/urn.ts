// Only post URNs are accepted. The service builds the embed URL itself and
// never accepts a full URL, so it cannot be used to load other sites.
const URN_PATTERN = /^urn:li:(activity|share|ugcPost):\d{1,20}$/;

const EMBED_BASE_URL = 'https://www.linkedin.com/embed/feed/update/';

export function isValidUrn(value: unknown): value is string {
  return typeof value === 'string' && URN_PATTERN.test(value);
}

/** Build the embed URL for a URN that passed isValidUrn. */
export function embedUrlForUrn(urn: string): string {
  return `${EMBED_BASE_URL}${urn}`;
}
