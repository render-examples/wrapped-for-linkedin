/**
 * Types for the story cards.
 */

import type { IconName } from '@components/Icon';

type CardType =
  | 'total-impressions'
  | 'members-reached'
  | 'best-month'
  | 'top-post'
  | 'audience-industry'
  | 'audience-snapshot'
  | 'badges'
  | 'new-followers'
  | 'year-summary';

// Fields shared by most cards. Each card sets only the fields it shows.
export interface CardData {
  value?: string;
  label?: string;
  icon?: IconName;
  context?: string;
  // Top post card.
  impressions?: string;
  url?: string;
  date?: string;
  // Top industry card. A fraction from 0 to 1.
  percentage?: number;
  // Year summary card.
  membersReached?: string;
  engagements?: string;
  newFollowers?: string;
}

export interface AudienceSection {
  label: string;
  items: { name: string; percentage: number }[];
}

interface StoryBadge {
  id: string;
  name: string;
  description: string;
  icon: IconName;
}

interface CardBase {
  id: string;
  title: string;
  backgroundColor: string;
  // CSS color for the card's accent.
  accent: string;
}

export type ShareableCard = CardBase &
  (
    | { type: 'audience-snapshot'; data: CardData & { sections: AudienceSection[] } }
    | { type: 'badges'; data: CardData & { badges: StoryBadge[] } }
    | { type: Exclude<CardType, 'audience-snapshot' | 'badges'>; data: CardData }
  );

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
