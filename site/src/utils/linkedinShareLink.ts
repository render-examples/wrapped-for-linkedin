/**
 * Build LinkedIn share links with prefilled post text.
 */

export const APP_URL = 'https://wrappedforlinkedin.onrender.com/';

export interface ShareTextInput {
  impressions?: string | number;
  membersReached?: string | number;
  year: number;
  // The share sentence of the user's top badge, if they earned one.
  topBadgeSentence?: string;
}

/**
 * Build the prefilled post text. If the user has a badge, the text starts with the badge sentence.
 */
export function buildShareText({ impressions, membersReached, year, topBadgeSentence }: ShareTextInput): string {
  const hashtags = `#WrappedForLinkedIn #${year}Recap`;

  if (topBadgeSentence) {
    return `${topBadgeSentence}\n\nGet your Wrapped for LinkedIn ${year}: ${APP_URL}\n\n${hashtags}`;
  }

  return [
    `🎁 Just got my Wrapped for LinkedIn ${year}!`,
    `This year: ${impressions || 0} impressions, ${membersReached || 0} people reached, and countless connections that mattered.`,
    `What's your LinkedIn story? Get yours here: ${APP_URL}`,
    hashtags,
  ].join('\n\n');
}

/**
 * Get the LinkedIn share URL with the prefilled post text.
 */
export function generateLinkedInShareUrl(input: ShareTextInput): string {
  return `https://www.linkedin.com/feed/?shareActive=true&text=${encodeURIComponent(buildShareText(input))}`;
}

/**
 * Open the LinkedIn share dialog in a new tab.
 */
export function openLinkedInShare(input: ShareTextInput): Window | null {
  return window.open(generateLinkedInShareUrl(input), '_blank');
}
