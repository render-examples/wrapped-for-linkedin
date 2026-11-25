/**
 * Parse the DISCOVERY sheet. It has labels in column A and values in column B:
 *   B1: date range, "MM/DD/YYYY - MM/DD/YYYY"
 *   B2: impressions
 *   B3: members reached
 */
import type { WorkBook } from 'xlsx';
import type { DiscoveryData } from '@utils/excel/types';
import { getCellValue, parseDate, parseNumber, findSheet } from '@utils/excel/utils';
import { SHEET_NAMES } from '@utils/excel/constants';

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

    return {
      start_date,
      end_date,
      total_impressions: parseNumber(getCellValue(sheet, 'B2')),
      members_reached: parseNumber(getCellValue(sheet, 'B3')),
    };
  } catch (error) {
    console.error('Error parsing DISCOVERY sheet:', error);
    return undefined;
  }
}
