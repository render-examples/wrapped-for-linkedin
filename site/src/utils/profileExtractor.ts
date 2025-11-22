/**
 * Utility to extract LinkedIn profile information
 */

/**
 * Extract LinkedIn profile ID from URL
 * Supports formats like:
 * - https://www.linkedin.com/in/username/
 * - https://www.linkedin.com/in/username
 * - /in/username
 */
export function extractLinkedInProfileId(url: string): string | null {
  if (!url) return null;

  try {
    // Match pattern /in/username
    const match = url.match(/\/in\/([^/?#]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error('Failed to extract LinkedIn profile ID:', error);
    return null;
  }
}

/**
 * Extract profile photo URL from LinkedIn post URL
 * LinkedIn posts contain the profile picture in the Open Graph meta tags
 * When shared as a link, we can infer the profile from the URL
 */
export function extractProfilePhotoFromPostUrl(postUrl: string): Promise<string | null> {
  if (!postUrl) return Promise.resolve(null);

  return fetch(postUrl, { mode: 'no-cors' })
    .then(response => response.text())
    .then(html => {
      // Try to extract og:image for the profile picture
      const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/);
      if (ogImageMatch && ogImageMatch[1]) {
        return ogImageMatch[1];
      }
      return null;
    })
    .catch(() => null);
}

/**
 * Generate LinkedIn profile photo URL from profile ID
 * Note: This uses a generic LinkedIn photo endpoint that may not always work
 * For better results, you'd need to store the actual photo URL during data parsing
 */
export function getLinkedInProfilePhotoUrl(profileId: string): string | null {
  if (!profileId) return null;

  // LinkedIn doesn't provide a simple public API for profile photos
  // This is a fallback that may not work for all profiles
  // Ideally, you should capture and store the actual profile photo during Excel parsing
  return `https://media.licdn.com/media-proxy/ext?w=200&h=200&f=pjpg&hash=${generateHashFromId(profileId)}`;
}

/**
 * Generate a simple hash from profile ID for variety
 * This is just for fallback purposes
 */
function generateHashFromId(profileId: string): string {
  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    const char = profileId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * Get a fallback avatar color based on profile ID
 * Used for displaying a colored circle when photo is unavailable
 */
export function getProfileAvatarColor(profileId: string | null): string {
  if (!profileId) return '#0A66C2';

  const colors = [
    '#0A66C2', // LinkedIn Blue
    '#00B4D8', // Cyan
    '#06A77D', // Green
    '#FFB703', // Orange
    '#FB5607', // Red-Orange
    '#9945FF', // Purple
    '#FF006E', // Pink
    '#2A9D8F', // Teal
  ];

  const hash = profileId
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}
