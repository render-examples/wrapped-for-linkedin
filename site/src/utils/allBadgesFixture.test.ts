import { describe, expect, it } from 'vitest';
import { processExcelFile } from '@utils/excel/excelProcessor';
import { BADGES, getEarnedBadges } from '@utils/badges';
// Vite inlines the file as a base64 data URL. The app tsconfig has no Node types, so node:fs is not available.
import fixtureDataUrl from '../../fixtures/all-badges.xlsx?inline';

function loadFixture(): File {
  const bytes = Uint8Array.from(atob(fixtureDataUrl.split(',')[1]), (char) => char.charCodeAt(0));
  return new File([bytes], 'all-badges.xlsx');
}

describe('fixtures/all-badges.xlsx', () => {
  it('earns every badge', async () => {
    const data = await processExcelFile(loadFixture());

    expect(getEarnedBadges(data).map((badge) => badge.id)).toEqual(BADGES.map((badge) => badge.id));
  });

  it('has audience demographics', async () => {
    const { demographics } = await processExcelFile(loadFixture());

    expect(demographics?.job_titles[0]?.name).toBe('Software Engineer');
    expect(demographics?.locations[0]?.name).toBe('San Francisco Bay Area');
    expect(demographics?.industries[0]?.name).toBe('Software Development');
    expect(demographics?.seniority?.[0]?.name).toBe('Senior');
    expect(demographics?.company_size?.[0]?.name).toBe('10,001+ employees');
    expect(demographics?.companies?.[0]?.name).toBe('Acme Corp');
  });

  it('has the median daily impressions and no mean', async () => {
    const { discovery_data, engagement_by_day = [] } = await processExcelFile(loadFixture());

    const sorted = engagement_by_day.map((day) => day.impressions ?? 0).sort((a, b) => a - b);
    // The fixture has 365 days, so the median is the middle value.
    expect(discovery_data?.median_daily_impressions).toBe(sorted[182]);
    expect(discovery_data).not.toHaveProperty('average_impressions_per_day');
  });
});
