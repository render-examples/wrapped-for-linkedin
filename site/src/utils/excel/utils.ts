/**
 * Helpers shared by the sheet parsers.
 */
import type { WorkSheet, WorkBook } from 'xlsx';
import { MAX_ROWS, CONSECUTIVE_EMPTY_ROWS, EXCEL_DATE_OFFSET, MS_PER_DAY, MIN_PERCENTAGE } from '@utils/excel/constants';

/**
 * Get the value of a cell, for example "B5". Returns undefined if the cell is empty.
 */
export function getCellValue(sheet: WorkSheet, cellAddress: string): unknown {
  return sheet[cellAddress]?.v;
}

/**
 * Parse a percentage such as 25.5, 0.255, "25.5%", or "< 1%".
 * @returns A fraction from 0 to 1.
 */
export function parsePercentage(value: unknown): number {
  if (typeof value === 'number') {
    // A number above 1 is a percentage. A number from 0 to 1 is already a fraction.
    return value > 1 && value <= 100 ? value / 100 : value;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  if (value.includes('<')) {
    return MIN_PERCENTAGE;
  }

  const parsed = parseFloat(value.replace(/[^\d.]/g, ''));
  return isNaN(parsed) ? 0 : parsed / 100;
}

/**
 * Parse a Date, a date string, or an Excel serial date.
 * @returns An ISO date (YYYY-MM-DD). Returns the input string if it is not a valid date,
 * and an empty string for other values that are not dates.
 */
export function parseDate(value: unknown): string {
  if (!value) return '';

  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }

  if (typeof value === 'string') {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return value;
  }

  if (typeof value === 'number') {
    const excelDate = new Date((value - EXCEL_DATE_OFFSET) * MS_PER_DAY);
    return excelDate.toISOString().split('T')[0];
  }

  return '';
}

/**
 * Parse a number. A string such as "1,234" loses all characters that are not digits.
 */
export function parseNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = parseInt(value.replace(/[^\d]/g, ''), 10);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Find the first sheet whose name matches one of `sheetNames`. The match is not case-sensitive.
 */
export function findSheet(workbook: WorkBook, sheetNames: string[]): WorkSheet | null {
  for (const sheetName of sheetNames) {
    const found = workbook.SheetNames.find((name) => name.toLowerCase() === sheetName.toLowerCase());
    if (found) {
      return workbook.Sheets[found];
    }
  }
  return null;
}

/**
 * Get the first URL in a cell. Returns the text as is if it has no URL.
 */
export function parseURL(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') {
    const urlMatch = value.match(/https?:\/\/[^\s"]+/);
    return urlMatch ? urlMatch[0] : value;
  }
  return String(value);
}

function containsKeyword(value: unknown, keywords: string[]): boolean {
  if (!value) return false;
  const text = String(value).toLowerCase().trim();
  return keywords.some((keyword) => text.includes(keyword));
}

/**
 * Find the first row where one of `columns` contains one of `keywords`. Use it to find a header row.
 * @returns The row number, or null if no row matches.
 */
export function findRowWithKeywords(
  sheet: WorkSheet,
  columns: string[],
  keywords: string[],
  maxRow: number = MAX_ROWS.HEADER_SCAN
): number | null {
  for (let row = 1; row <= maxRow; row++) {
    for (const col of columns) {
      if (containsKeyword(getCellValue(sheet, `${col}${row}`), keywords)) {
        return row;
      }
    }
  }
  return null;
}

/**
 * Yield the row numbers from `startRow` that have a value in at least one of `columns`.
 * Stop after `maxEmptyRows` empty rows in a row.
 */
export function* iterateRowsUntilEmpty(
  sheet: WorkSheet,
  startRow: number,
  columns: string[],
  maxRow: number = MAX_ROWS.DATA,
  maxEmptyRows: number = CONSECUTIVE_EMPTY_ROWS
): Generator<number> {
  let emptyRowCount = 0;

  for (let row = startRow; row <= maxRow; row++) {
    const isEmpty = columns.every((col) => !getCellValue(sheet, `${col}${row}`));

    if (isEmpty) {
      emptyRowCount++;
      if (emptyRowCount >= maxEmptyRows) {
        break;
      }
      continue;
    }

    emptyRowCount = 0;
    yield row;
  }
}

/**
 * Get the values of `columns` in one row, keyed by column letter.
 */
export function getRowValues(sheet: WorkSheet, row: number, columns: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const col of columns) {
    result[col] = getCellValue(sheet, `${col}${row}`);
  }
  return result;
}
