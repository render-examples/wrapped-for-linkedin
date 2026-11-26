import { describe, expect, it } from 'vitest';
import { generateShareableCards, getAudienceSections } from './cardDataMapper';
import type { ParsedExcelData } from './excel/types';

const base: ParsedExcelData = {
  discovery_data: {
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    total_impressions: 500_000,
    members_reached: 88_100,
  },
  demographics: {
    job_titles: [],
    industries: [{ name: 'Software Development', percentage: 0.3 }],
    locations: [
      { name: 'San Francisco Bay Area', percentage: 0.214 },
      { name: 'New York City', percentage: 0.1 },
      { name: 'London', percentage: 0.05 },
      { name: 'Berlin', percentage: 0.04 },
    ],
    companies: [{ name: 'Render', percentage: 0.02 }],
    seniority: [],
  },
};

const cardIds = (data: ParsedExcelData) => generateShareableCards(data).map((card) => card.id);

describe('getAudienceSections', () => {
  it('returns the top 3 items of each category and skips empty ones', () => {
    expect(getAudienceSections(base.demographics)).toEqual([
      { label: 'Top companies', items: [{ name: 'Render', percentage: 2 }] },
      {
        label: 'Top locations',
        items: [
          { name: 'San Francisco Bay Area', percentage: 21 },
          { name: 'New York City', percentage: 10 },
          { name: 'London', percentage: 5 },
        ],
      },
    ]);
  });

  it('returns nothing when all categories are empty', () => {
    expect(getAudienceSections({ job_titles: [], industries: [], locations: [] })).toEqual([]);
    expect(getAudienceSections(undefined)).toEqual([]);
  });
});

describe('generateShareableCards', () => {
  it('places the audience card after Industry Insider', () => {
    const ids = cardIds(base);
    expect(ids.indexOf('audience-snapshot')).toBe(ids.indexOf('top-industry') + 1);
  });

  it('skips the audience card when there is no audience data', () => {
    expect(cardIds({ ...base, demographics: undefined })).not.toContain('audience-snapshot');
  });

  it('skips the badges card when no badges are earned', () => {
    expect(cardIds(base)).not.toContain('badges');
  });

  it('places the badges card just before Year in review', () => {
    const ids = cardIds({
      ...base,
      discovery_data: { ...base.discovery_data!, total_impressions: 1_200_000 },
    });
    expect(ids.slice(-2)).toEqual(['badges', 'year-summary']);
  });

  it('omits the count in the Network Ninja text', () => {
    const card = generateShareableCards(base).find((c) => c.id === 'members-reached');
    expect(card?.data.context).toBe("You reached 88.1K people. That's like filling AT&T Stadium!");
  });

  it('counts engagements, not people, on the best month card', () => {
    const card = generateShareableCards({
      ...base,
      engagement_by_day: [
        { date: '2026-03-01', engagement: 1_200 },
        { date: '2026-03-02', engagement: 34 },
      ],
    }).find((c) => c.id === 'best-month');
    expect(card?.data.context).toBe('1,234 engagements on your content');
  });

  it('does not set a background color on cards', () => {
    for (const card of generateShareableCards(base)) {
      expect(card).not.toHaveProperty('backgroundColor');
    }
  });
});
