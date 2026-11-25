import { describe, expect, it } from 'vitest';
import { formatVenueComparison } from './venueComparison';

describe('formatVenueComparison', () => {
  it('uses "1 time" when the reach matches a venue', () => {
    expect(formatVenueComparison(80_000)).toBe("That's like filling AT&T Stadium 1 time");
  });

  it('uses "1 time" when the rounded ratio is above 1', () => {
    expect(formatVenueComparison(88_100)).toBe("That's like filling AT&T Stadium 1 time");
  });

  it('picks the largest venue that fits', () => {
    expect(formatVenueComparison(160_000)).toBe("That's like filling Coachella 1 time");
    expect(formatVenueComparison(199_000)).toBe("That's like filling Coachella 1 time");
    expect(formatVenueComparison(400_000)).toBe("That's like filling Times Square 1 time");
  });

  it('uses "twice" when the largest venue fills two times', () => {
    expect(formatVenueComparison(1_500_000)).toBe("That's like filling Grand Central Terminal twice");
    expect(formatVenueComparison(2_200_000)).toBe("That's like filling Grand Central Terminal twice");
  });

  it('uses "N times" when the largest venue fills three or more times', () => {
    expect(formatVenueComparison(2_250_000)).toBe("That's like filling Grand Central Terminal 3 times");
  });

  it('returns null below the smallest venue', () => {
    expect(formatVenueComparison(21_999)).toBeNull();
  });
});
