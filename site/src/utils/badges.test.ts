import { describe, expect, it } from 'vitest';
import {
  BADGES,
  COMMUNITY_BUILDER_FOLLOWERS,
  GRINDSET_MONTHS,
  MILLIONAIRE_IMPRESSIONS,
  VIRAL_POST_IMPRESSIONS,
  getEarnedBadges,
} from './badges';
import type { ParsedExcelData } from './excel/types';

const discovery = (
  overrides: Partial<NonNullable<ParsedExcelData['discovery_data']>>,
) => ({
  discovery_data: {
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    total_impressions: 0,
    members_reached: 0,
    ...overrides,
  },
});

const topPost = (impressions: number): ParsedExcelData => ({
  top_posts: [
    {
      rank: 1,
      url: 'https://www.linkedin.com/feed/update/urn:li:share:1',
      publish_date: '2026-03-01',
      engagements: 10,
      impressions,
    },
  ],
});

const activeMonths = (count: number): ParsedExcelData => ({
  engagement_by_day: [
    ...Array.from({ length: count }, (_, i) => ({
      date: `${2026 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, '0')}-15`,
      engagement: 1,
    })),
    // Days with no engagement do not count.
    { date: '2027-06-01', engagement: 0 },
  ],
});

const earnedIds = (data: ParsedExcelData) =>
  getEarnedBadges(data).map((badge) => badge.id);

describe('getEarnedBadges', () => {
  it('earns no badges with no data', () => {
    expect(getEarnedBadges({})).toEqual([]);
  });

  it('earns Millionaire at 1M total impressions', () => {
    expect(
      earnedIds(discovery({ total_impressions: MILLIONAIRE_IMPRESSIONS - 1 })),
    ).toEqual([]);
    expect(
      earnedIds(discovery({ total_impressions: MILLIONAIRE_IMPRESSIONS })),
    ).toEqual(['millionaire']);
  });

  it('earns Viral at 100K impressions on the top post', () => {
    expect(earnedIds(topPost(VIRAL_POST_IMPRESSIONS - 1))).toEqual([]);
    expect(earnedIds(topPost(VIRAL_POST_IMPRESSIONS))).toEqual(['viral']);
  });

  it('earns Community builder at 1,000 new followers', () => {
    expect(
      earnedIds(discovery({ new_followers: COMMUNITY_BUILDER_FOLLOWERS - 1 })),
    ).toEqual([]);
    expect(
      earnedIds(discovery({ new_followers: COMMUNITY_BUILDER_FOLLOWERS })),
    ).toEqual(['community-builder']);
  });

  it('earns Grindset with engagement in 12 months', () => {
    expect(earnedIds(activeMonths(GRINDSET_MONTHS - 1))).toEqual([]);
    expect(earnedIds(activeMonths(GRINDSET_MONTHS))).toEqual(['grindset']);
  });

  it('counts each month once', () => {
    const data: ParsedExcelData = {
      engagement_by_day: Array.from({ length: 30 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, '0')}`,
        engagement: 5,
      })),
    };
    expect(earnedIds(data)).toEqual([]);
  });

  it('returns earned badges in rank order', () => {
    const data: ParsedExcelData = {
      ...discovery({ total_impressions: 2_000_000, new_followers: 5_000 }),
      ...topPost(200_000),
      ...activeMonths(12),
    };
    expect(earnedIds(data)).toEqual(BADGES.map((badge) => badge.id));
  });
});
