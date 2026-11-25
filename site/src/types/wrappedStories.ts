/**
 * Types for Wrapped Stories components
 */

import type { IconName } from '@components/Icon';

export type CardType =
  | 'total-impressions'
  | 'members-reached'
  | 'best-month'
  | 'top-post'
  | 'audience-industry'
  | 'audience-snapshot'
  | 'badges'
  | 'new-followers'
  | 'year-summary'
  | 'peak-performer';

export interface CardData {
  value?: number | string;
  label?: string;
  icon?: IconName;
  context?: string;
  venueComparison?: {
    // Venue comparison for reach visualization
    venue: string;
    times: number;
  };
  [key: string]: any; // Allow card-specific properties
}

export interface AudienceSection {
  label: string;
  items: { name: string; percentage: number }[];
}

export interface StoryBadge {
  id: string;
  name: string;
  description: string;
  icon: IconName;
}

export interface ShareableCard {
  id: string;
  type: CardType;
  title: string;
  data: CardData;
  backgroundColor: string;
  // CSS color for the card's accent.
  accent: string;
}

/**
 * Values the share button needs for file names and the LinkedIn share text.
 */
export interface ShareInfo {
  impressions: string;
  membersReached: string;
  year: number;
  // URL of the top post, used for the Peak Performer screenshot in exports.
  topPostUrl?: string;
  // Share sentence of the user's top badge, if they earned one.
  topBadgeSentence?: string;
}

export interface WrappedStoriesState {
  currentCardIndex: number;
  totalCards: number;
  isAutoPlaying: boolean;
  cards: ShareableCard[];
}
