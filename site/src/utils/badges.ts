/**
 * Badges a user earns when their analytics meet a threshold.
 * The list order is the rank. The first earned badge is the top badge.
 */

import type { IconName } from '@components/Icon';
import type { ParsedExcelData } from '@utils/excel/types';
import { formatNumber } from '@utils/formatters';

export const MILLIONAIRE_IMPRESSIONS = 1_000_000;
export const VIRAL_POST_IMPRESSIONS = 100_000;
export const COMMUNITY_BUILDER_FOLLOWERS = 1_000;
export const THOUGHT_LEADER_POSTS = 20;
export const THOUGHT_LEADER_ENGAGEMENTS = 10;
export const GRINDSET_MONTHS = 12;

export interface Badge {
  id: 'millionaire' | 'viral' | 'community-builder' | 'thought-leader' | 'grindset';
  name: string;
  // The rule, as shown to the user.
  description: string;
  // The first line of the LinkedIn share text.
  shareSentence: string;
  icon: IconName;
  isEarned: (data: ParsedExcelData) => boolean;
}

/**
 * Count the posts with at least THOUGHT_LEADER_ENGAGEMENTS engagements.
 * The export lists only the top 50 posts by engagement, and posts that are only in the
 * impressions list have 0 engagements here. So the count is exact below 50.
 */
function countEngagedPosts(data: ParsedExcelData): number {
  return (data.top_posts ?? []).filter((post) => post.engagements >= THOUGHT_LEADER_ENGAGEMENTS)
    .length;
}

/**
 * Count the calendar months that have at least one engagement.
 */
function countActiveMonths(data: ParsedExcelData): number {
  const months = new Set<string>();
  for (const day of data.engagement_by_day ?? []) {
    if (day.engagement > 0) {
      // Dates are ISO strings (YYYY-MM-DD), so the first 7 characters are the month.
      months.add(day.date.slice(0, 7));
    }
  }
  return months.size;
}

export const BADGES: Badge[] = [
  {
    id: 'millionaire',
    name: 'Millionaire',
    description: `${formatNumber(MILLIONAIRE_IMPRESSIONS)}+ total impressions`,
    shareSentence: `I hit ${formatNumber(MILLIONAIRE_IMPRESSIONS)}+ impressions on LinkedIn this year. Did you?`,
    icon: 'gem',
    isEarned: (data) => (data.discovery_data?.total_impressions ?? 0) >= MILLIONAIRE_IMPRESSIONS,
  },
  {
    id: 'viral',
    name: 'Main character',
    description: `A post with ${formatNumber(VIRAL_POST_IMPRESSIONS)}+ impressions`,
    shareSentence: `One of my posts hit ${formatNumber(VIRAL_POST_IMPRESSIONS)} impressions this year. Did yours?`,
    icon: 'rocket',
    isEarned: (data) => (data.top_posts?.[0]?.impressions ?? 0) >= VIRAL_POST_IMPRESSIONS,
  },
  {
    id: 'community-builder',
    name: 'Community builder',
    description: `${COMMUNITY_BUILDER_FOLLOWERS.toLocaleString('en-US')}+ new followers`,
    shareSentence: `I gained ${COMMUNITY_BUILDER_FOLLOWERS.toLocaleString('en-US')}+ new followers this year. Did you?`,
    icon: 'handshake',
    isEarned: (data) => (data.discovery_data?.new_followers ?? 0) >= COMMUNITY_BUILDER_FOLLOWERS,
  },
  {
    id: 'thought-leader',
    name: 'Thought leader',
    description: `${THOUGHT_LEADER_POSTS}+ posts with ${THOUGHT_LEADER_ENGAGEMENTS}+ engagements`,
    shareSentence: `I wrote ${THOUGHT_LEADER_POSTS}+ posts that got ${THOUGHT_LEADER_ENGAGEMENTS}+ engagements each this year. Did you?`,
    icon: 'thought',
    isEarned: (data) => countEngagedPosts(data) >= THOUGHT_LEADER_POSTS,
  },
  {
    id: 'grindset',
    name: 'Grindset',
    description: `Engagement in all ${GRINDSET_MONTHS} months`,
    shareSentence: 'I showed up on LinkedIn every month this year. Did you?',
    icon: 'fire',
    isEarned: (data) => countActiveMonths(data) >= GRINDSET_MONTHS,
  },
];

/**
 * Get the badges the user earned, in rank order.
 */
export function getEarnedBadges(data: ParsedExcelData): Badge[] {
  return BADGES.filter((badge) => badge.isEarned(data));
}
