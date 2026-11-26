import { afterEach, describe, expect, it, vi } from 'vitest';
import { calculateBestMonth } from './bestMonthCalculator';

describe('calculateBestMonth', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('returns the month with the most engagements', () => {
    expect(
      calculateBestMonth([
        { date: '2024-02-10', engagement: 5 },
        { date: '2024-03-10', engagement: 7 },
        { date: '2024-03-11', engagement: 4 },
      ]),
    ).toEqual({ month: 'Mar', monthYear: 'Mar 2024', engagements: 11 });
  });

  it('counts the 1st of a month toward that month west of UTC', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(
      calculateBestMonth([
        { date: '2024-02-29', engagement: 5 },
        { date: '2024-03-01', engagement: 10 },
      ]),
    ).toEqual({ month: 'Mar', monthYear: 'Mar 2024', engagements: 10 });
  });

  it('returns null when no month has engagements', () => {
    expect(calculateBestMonth([])).toBeNull();
    expect(calculateBestMonth([{ date: '2024-03-01', engagement: 0 }])).toBeNull();
  });
});
