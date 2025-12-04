/**
 * Types for Wrapped Stories components
 */

export type CardType =
  | 'total-impressions'
  | 'members-reached'
  | 'best-month'
  | 'top-post'
  | 'audience-industry'
  | 'audience-location'
  | 'new-followers'
  | 'year-summary'
  | 'peak-performer';

export interface CardData {
  value?: number | string;
  label?: string;
  icon?: string;
  context?: string;
  profileId?: string; // LinkedIn profile ID
  avatarColor?: string; // Avatar background color
  profilePhotoUrl?: string; // LinkedIn profile picture URL
  venueComparison?: {
    // Venue comparison for reach visualization
    venue: string;
    times: number;
  };
  [key: string]: any; // Allow card-specific properties
}

export interface ShareableCard {
  id: string;
  type: CardType;
  title: string;
  data: CardData;
  backgroundColor: string;
  gradient: string;
}

export interface WrappedStoriesState {
  currentCardIndex: number;
  totalCards: number;
  isAutoPlaying: boolean;
  cards: ShareableCard[];
}
