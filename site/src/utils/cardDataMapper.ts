/**
 * Map parsed Excel data to shareable story cards.
 */

import type { AudienceSection, ShareableCard } from '@/types/wrappedStories';
import type { DemographicInsights, DemographicItem, ParsedExcelData } from '@utils/excel/types';
import { calculateBestMonth } from '@utils/bestMonthCalculator';
import { formatVenueComparison } from '@utils/venueComparison';
import { formatNumber } from '@utils/formatters';
import { getEarnedBadges } from '@utils/badges';

const AUDIENCE_ITEMS_PER_SECTION = 3;
const CARD_BACKGROUND = '#0d0d0d';

// Convert a fraction from 0 to 1 to a whole-number percentage.
function toPercent(fraction: number | undefined): number {
  return Math.round((fraction || 0) * 100);
}

/**
 * Get the top companies, locations, and seniority levels of the people who saw the posts.
 * Empty categories are skipped.
 */
export function getAudienceSections(demographics?: DemographicInsights): AudienceSection[] {
  const categories: [string, DemographicItem[] | undefined][] = [
    ['Top companies', demographics?.companies],
    ['Top locations', demographics?.locations],
    ['Top seniority levels', demographics?.seniority],
  ];

  return categories.flatMap(([label, items]) =>
    items && items.length > 0
      ? [
          {
            label,
            items: items.slice(0, AUDIENCE_ITEMS_PER_SECTION).map((item) => ({
              name: item.name,
              percentage: toPercent(item.percentage),
            })),
          },
        ]
      : []
  );
}

/**
 * Make the shareable cards from parsed Excel data.
 * The cards are in story order. Cards without data are skipped.
 */
export function generateShareableCards(data: ParsedExcelData): ShareableCard[] {
  const cards: ShareableCard[] = [];

  // Total impressions
  if (data.discovery_data?.total_impressions) {
    cards.push({
      id: 'total-impressions',
      type: 'total-impressions',
      title: 'Impression Icon',
      data: {
        value: formatNumber(data.discovery_data.total_impressions),
        label: 'Total impressions',
        icon: 'sparkle',
        context: 'Your posts were seen this many times',
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-purple)',
    });
  }

  // Members reached
  if (data.discovery_data?.members_reached) {
    const membersReached = data.discovery_data.members_reached;
    const venueFormatted = formatVenueComparison(membersReached);
    const contextMessage = venueFormatted
      ? `You reached ${formatNumber(membersReached)} people. ${venueFormatted}!`
      : 'Your network is powerful';

    cards.push({
      id: 'members-reached',
      type: 'members-reached',
      title: 'Network Ninja',
      data: {
        value: formatNumber(membersReached),
        label: 'Unique Professionals Reached',
        icon: 'users',
        context: contextMessage,
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-blue)',
    });
  }

  // Top post
  if (data.top_posts && data.top_posts.length > 0) {
    const topPost = data.top_posts[0];

    cards.push({
      id: 'top-post',
      type: 'top-post',
      title: 'Peak Performer',
      data: {
        value: formatNumber(topPost.engagements),
        impressions: topPost.impressions ? formatNumber(topPost.impressions) : undefined,
        label: 'Engagements on Your Top Post',
        context: 'Your highest-performing content',
        url: topPost.url,
        date: topPost.publish_date,
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-yellow)',
    });
  }

  // Top industry
  if (data.demographics?.industries && data.demographics.industries.length > 0) {
    const topIndustry = data.demographics.industries[0];
    const percentage = toPercent(topIndustry.percentage);
    cards.push({
      id: 'top-industry',
      type: 'audience-industry',
      title: 'Industry Insider',
      data: {
        value: topIndustry.name,
        label: `${percentage}% of Your Audience`,
        icon: 'briefcase',
        context: 'Your primary professional industry',
        percentage: topIndustry.percentage,
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-green)',
    });
  }

  // Audience snapshot
  const audienceSections = getAudienceSections(data.demographics);
  if (audienceSections.length > 0) {
    cards.push({
      id: 'audience-snapshot',
      type: 'audience-snapshot',
      title: 'Your Audience',
      data: {
        context: 'The people who saw your posts',
        sections: audienceSections,
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-blue)',
    });
  }

  // Best month
  const bestMonth = calculateBestMonth(data.engagement_by_day ?? []);
  if (bestMonth) {
    cards.push({
      id: 'best-month',
      type: 'best-month',
      title: 'Engagement Expert',
      data: {
        value: bestMonth.monthYear,
        label: 'was your month',
        icon: 'calendar',
        context: `${bestMonth.peopleEngaged.toLocaleString()} people interacted with your content`,
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-green)',
    });
  }

  // New followers
  if (data.discovery_data?.new_followers) {
    cards.push({
      id: 'new-followers',
      type: 'new-followers',
      title: 'Popular Professional',
      data: {
        value: `+${formatNumber(data.discovery_data.new_followers)}`,
        label: 'New Followers this year',
        icon: 'confetti',
        context: 'Your community is growing!',
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-pink)',
    });
  }

  // Badges
  const badges = getEarnedBadges(data);
  if (badges.length > 0) {
    cards.push({
      id: 'badges',
      type: 'badges',
      title: 'Your Badges',
      data: {
        context:
          badges.length === 1
            ? 'You earned 1 badge this year'
            : `You earned ${badges.length} badges this year`,
        badges: badges.map(({ id, name, description, icon }) => ({ id, name, description, icon })),
      },
      backgroundColor: CARD_BACKGROUND,
      accent: 'var(--accent-purple)',
    });
  }

  // Year summary. This card is always last.
  cards.push({
    id: 'year-summary',
    type: 'year-summary',
    title: 'Year in review',
    data: {
      impressions: formatNumber(data.discovery_data?.total_impressions || 0),
      membersReached: formatNumber(data.discovery_data?.members_reached || 0),
      engagements: formatNumber(data.discovery_data?.total_engagements || 0),
      newFollowers: formatNumber(data.discovery_data?.new_followers || 0),
      context: '',
    },
    backgroundColor: CARD_BACKGROUND,
    accent: 'var(--accent-purple)',
  });

  return cards;
}
