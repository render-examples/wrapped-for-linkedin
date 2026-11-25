// Only post URNs are accepted. The service builds the embed URL itself and
// never accepts a full URL, so it cannot be used to load other sites.
const URN_PATTERN = /^urn:li:(activity|share|ugcPost):\d+$/;

const EMBED_BASE = 'https://www.linkedin.com/embed/feed/update/';

/**
 * @param {unknown} value
 * @returns {value is string}
 */
export function isValidUrn(value) {
  return typeof value === 'string' && URN_PATTERN.test(value);
}

/**
 * @param {string} urn A URN that passed isValidUrn.
 */
export function embedUrlForUrn(urn) {
  return `${EMBED_BASE}${urn}`;
}
