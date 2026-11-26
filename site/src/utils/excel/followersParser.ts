/**
 * Parse the FOLLOWERS sheet.
 * Row 1 has the total follower count, row 3 has the headers, and from row 4
 * column B has the new followers for each day.
 */
import type { WorkBook } from 'xlsx';
import { getCellValue, parseNumber, findSheet } from '@utils/excel/utils';
import { SHEET_NAMES, COLUMN_LAYOUTS } from '@utils/excel/constants';

const DATA_START_ROW = 4;
// A year of daily rows, with a small margin.
const DATA_END_ROW = DATA_START_ROW + 368;

/**
 * @returns The sum of new followers in the period, or undefined if the sheet is missing or cannot be read.
 */
export function parseFollowers(workbook: WorkBook): number | undefined {
  const sheet = findSheet(workbook, SHEET_NAMES.FOLLOWERS);
  if (!sheet) {
    console.warn('FOLLOWERS sheet not found');
    return undefined;
  }

  try {
    const column = COLUMN_LAYOUTS.FOLLOWERS.NEW_FOLLOWERS;
    let newFollowers = 0;

    for (let row = DATA_START_ROW; row <= DATA_END_ROW; row++) {
      const count = getCellValue(sheet, `${column}${row}`);
      // The first empty cell is the end of the data.
      if (count === undefined || count === null) {
        break;
      }
      newFollowers += parseNumber(count);
    }

    return newFollowers;
  } catch (error) {
    console.error('Error parsing FOLLOWERS sheet:', error);
    return undefined;
  }
}
