/**
 * Parse the ENGAGEMENT sheet. It has one row per day:
 * column A is the date, B is impressions, and C is engagements.
 */
import type { WorkBook } from 'xlsx';
import type { EngagementByDay } from '@utils/excel/types';
import {
  parseDate,
  parseNumber,
  findSheet,
  findRowWithKeywords,
  iterateRowsUntilEmpty,
  getRowValues,
} from '@utils/excel/utils';
import { SHEET_NAMES, COLUMN_LAYOUTS, HEADER_KEYWORDS, MAX_ROWS } from '@utils/excel/constants';

/**
 * @returns The daily metrics in sheet order, or an empty array if the sheet is missing or cannot be read.
 */
export function parseEngagement(workbook: WorkBook): EngagementByDay[] {
  const sheet = findSheet(workbook, SHEET_NAMES.ENGAGEMENT);
  if (!sheet) {
    console.warn('ENGAGEMENT sheet not found');
    return [];
  }

  try {
    const layout = COLUMN_LAYOUTS.ENGAGEMENT;
    const columns = [layout.DATE, layout.IMPRESSIONS, layout.ENGAGEMENTS];

    const headerRow = findRowWithKeywords(sheet, columns, HEADER_KEYWORDS.DATE);
    if (!headerRow) {
      console.warn('Could not find header row in ENGAGEMENT sheet');
      return [];
    }

    const engagementData: EngagementByDay[] = [];
    for (const row of iterateRowsUntilEmpty(sheet, headerRow + 1, columns, MAX_ROWS.DATA)) {
      const values = getRowValues(sheet, row, columns);

      const date = parseDate(values[layout.DATE]);
      if (!date) continue;

      engagementData.push({
        date,
        engagement: parseNumber(values[layout.ENGAGEMENTS]),
        impressions: parseNumber(values[layout.IMPRESSIONS]),
      });
    }

    return engagementData;
  } catch (error) {
    console.error('Error parsing ENGAGEMENT sheet:', error);
    return [];
  }
}

export function calculateTotalEngagements(engagementByDay: EngagementByDay[]): number {
  return engagementByDay.reduce((sum, item) => sum + item.engagement, 0);
}

/**
 * Get the median of the daily impressions. A missing value counts as 0.
 */
export function calculateMedianDailyImpressions(engagementByDay: EngagementByDay[]): number {
  const impressions = engagementByDay
    .map((item) => item.impressions || 0)
    .filter((value) => value >= 0)
    .sort((a, b) => a - b);

  if (impressions.length === 0) {
    return 0;
  }

  const middle = Math.floor(impressions.length / 2);
  if (impressions.length % 2 === 1) {
    return impressions[middle];
  }
  return (impressions[middle - 1] + impressions[middle]) / 2;
}
