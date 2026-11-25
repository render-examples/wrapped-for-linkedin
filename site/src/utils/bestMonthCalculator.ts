/**
 * Find the month with the most engagements.
 */

import type { EngagementByDay } from '@utils/excel/types';

interface BestMonthData {
  // For example "Nov".
  month: string;
  // For example "Nov 2024".
  monthYear: string;
  engagements: number;
}

const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

/**
 * @returns The month with the most engagements, or null if no month has engagements.
 */
export function calculateBestMonth(engagementByDay: EngagementByDay[]): BestMonthData | null {
  // Engagements by month key (YYYY-MM). Dates are ISO strings, so the first 7 characters are the month.
  // Do not use new Date() here. It parses an ISO date as UTC, which moves the 1st of a month
  // into the previous month west of UTC.
  const months = new Map<string, number>();
  for (const item of engagementByDay) {
    const monthKey = item.date.slice(0, 7);
    months.set(monthKey, (months.get(monthKey) ?? 0) + item.engagement);
  }

  let bestMonth: BestMonthData | null = null;
  for (const [monthKey, engagements] of months) {
    if (engagements > (bestMonth?.engagements ?? 0)) {
      const [year, month] = monthKey.split('-').map(Number);
      const monthYear = monthYearFormatter.format(new Date(year, month - 1, 1));
      bestMonth = { month: monthYear.split(' ')[0], monthYear, engagements };
    }
  }

  return bestMonth;
}
