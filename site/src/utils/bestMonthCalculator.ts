/**
 * Find the month with the most engagements.
 */

import type { EngagementByDay } from '@utils/excel/types';

export interface BestMonthData {
  // For example "Nov".
  month: string;
  // For example "Nov 2024".
  monthYear: string;
  engagements: number;
  // The sum of the positive daily engagement counts.
  peopleEngaged: number;
}

const monthYearFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' });

/**
 * @returns The month with the most engagements, or null if no month has engagements.
 */
export function calculateBestMonth(engagementByDay: EngagementByDay[]): BestMonthData | null {
  const months = new Map<string, { engagements: number; peopleEngaged: number; date: Date }>();

  for (const item of engagementByDay) {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    let month = months.get(monthKey);
    if (!month) {
      month = { engagements: 0, peopleEngaged: 0, date };
      months.set(monthKey, month);
    }

    month.engagements += item.engagement;
    if (item.engagement > 0) {
      month.peopleEngaged += item.engagement;
    }
  }

  let bestMonth: BestMonthData | null = null;
  for (const { engagements, peopleEngaged, date } of months.values()) {
    if (engagements > (bestMonth?.engagements ?? 0)) {
      const monthYear = monthYearFormatter.format(date);
      bestMonth = { month: monthYear.split(' ')[0], monthYear, engagements, peopleEngaged };
    }
  }

  return bestMonth;
}
