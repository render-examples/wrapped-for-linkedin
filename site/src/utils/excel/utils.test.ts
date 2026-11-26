import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseDate } from './utils';

describe('parseDate', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it.each(['Asia/Tokyo', 'America/Los_Angeles', 'UTC'])(
    'keeps the day of MM/DD/YYYY in %s',
    (tz) => {
      vi.stubEnv('TZ', tz);
      expect(parseDate('1/15/2024')).toBe('2024-01-15');
      expect(parseDate('12/31/2024')).toBe('2024-12-31');
    },
  );

  it.each(['Asia/Tokyo', 'America/Los_Angeles'])('keeps the day of an ISO date in %s', (tz) => {
    vi.stubEnv('TZ', tz);
    expect(parseDate('2024-01-15')).toBe('2024-01-15');
  });

  it('keeps the local day of a Date east of UTC', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(parseDate(new Date(2024, 0, 15))).toBe('2024-01-15');
  });

  it('parses an Excel serial date', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(parseDate(45306)).toBe('2024-01-15');
  });

  it('returns a string that is not a date as is, and an empty string for no value', () => {
    expect(parseDate('not a date')).toBe('not a date');
    expect(parseDate(undefined)).toBe('');
  });
});
