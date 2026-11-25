/**
 * Parse the DISCOVERY sheet. It has labels in column A and values in column B:
 *   B1: date range, "MM/DD/YYYY - MM/DD/YYYY"
 *   B2: impressions
 *   B3: members reached
 */
import type { WorkBook } from 'xlsx';
import type { DiscoveryData } from '@utils/excel/types';
import { getCellValue, parseDate, parseNumber, findSheet } from '@utils/excel/utils';
import { MS_PER_DAY, SHEET_NAMES } from '@utils/excel/constants';

/**
 * @returns The overall metrics, or undefined if the sheet is missing or cannot be read.
 */
export function parseDiscovery(workbook: WorkBook): DiscoveryData | undefined {
  const sheet = findSheet(workbook, SHEET_NAMES.DISCOVERY);
  if (!sheet) {
    console.warn('DISCOVERY sheet not found');
    return undefined;
  }

  try {
    const dateRange = String(getCellValue(sheet, 'B1') || '');
    const [startStr, endStr] = dateRange.split('-').map((s) => s.trim());

    const start_date = parseDate(startStr);
    const end_date = parseDate(endStr);
    const total_impressions = parseNumber(getCellValue(sheet, 'B2'));

    const discoveryData: DiscoveryData = {
      start_date,
      end_date,
      total_impressions,
      members_reached: parseNumber(getCellValue(sheet, 'B3')),
    };

    if (start_date && end_date && total_impressions > 0) {
      discoveryData.average_impressions_per_day = Math.round(
        total_impressions / countDaysInRange(start_date, end_date)
      );
    }

    return discoveryData;
  } catch (error) {
    console.error('Error parsing DISCOVERY sheet:', error);
    return undefined;
  }
}

// Count the days from startDate to endDate, both included. The result is at least 1.
function countDaysInRange(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
  return Math.max(1, days);
}
