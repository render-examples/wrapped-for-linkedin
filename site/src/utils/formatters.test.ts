import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatDateString, formatNumber } from './formatters';

describe('formatNumber', () => {
  it('keeps numbers below 1,000', () => {
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });

  it('uses K and M with one decimal', () => {
    expect(formatNumber(1_500)).toBe('1.5K');
    expect(formatNumber(12_345)).toBe('12.3K');
    expect(formatNumber(999_949)).toBe('999.9K');
    expect(formatNumber(1_200_000)).toBe('1.2M');
  });

  it('strips a trailing ".0"', () => {
    expect(formatNumber(1_000)).toBe('1K');
    expect(formatNumber(1_040)).toBe('1K');
    expect(formatNumber(2_000_000)).toBe('2M');
  });

  it('moves to the next unit when the rounded value reaches 1,000', () => {
    expect(formatNumber(999_950)).toBe('1M');
    expect(formatNumber(999_999)).toBe('1M');
  });
});

describe('formatDateString', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('keeps the day west of UTC', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles');
    expect(formatDateString('2024-03-01')).toBe('March 1, 2024');
  });

  it('keeps the day east of UTC', () => {
    vi.stubEnv('TZ', 'Asia/Tokyo');
    expect(formatDateString('2024-03-01')).toBe('March 1, 2024');
  });

  it('returns a value that is not a date as is', () => {
    expect(formatDateString('not a date')).toBe('not a date');
    expect(formatDateString('')).toBe('');
  });
});
