/**
 * Parse the DEMOGRAPHICS or AUDIENCE DEMOGRAPHICS sheet. Each row has a category in column A, such as "Job titles",
 * an item name in column B, and a percentage in column C. The rows of one category are together.
 */
import type { WorkBook, WorkSheet } from 'xlsx';
import type { DemographicInsights, DemographicItem } from '@utils/excel/types';
import { getCellValue, parsePercentage, findSheet } from '@utils/excel/utils';
import { SHEET_NAMES, COLUMN_LAYOUTS, MAX_ROWS } from '@utils/excel/constants';

type Category = keyof DemographicInsights;

// Patterns that match the lowercase category names in column A, singular or plural.
const CATEGORY_PATTERNS: [Category, RegExp][] = [
  ['job_titles', /^job titles?$/],
  ['locations', /^locations?$/],
  ['industries', /^industr(y|ies)$/],
  ['seniority', /^seniority$/],
  ['company_size', /^company sizes?$/],
  ['companies', /^(specific )?compan(y|ies)$/],
];

function getCategory(cellValue: unknown): Category | null {
  if (!cellValue) return null;
  const name = String(cellValue).toLowerCase().trim();
  return CATEGORY_PATTERNS.find(([, pattern]) => pattern.test(name))?.[0] ?? null;
}

// Return true for an empty name or a column header.
function isHeaderValue(value: unknown): boolean {
  if (!value) return true;
  const str = String(value).toLowerCase().trim();
  return str === 'value' || str === 'percentage';
}

/**
 * Read the rows of one category from `startRow` until the category changes.
 * @returns The items, highest percentage first.
 */
function parseCategoryRows(
  sheet: WorkSheet,
  startRow: number,
  category: Category,
): DemographicItem[] {
  const items: DemographicItem[] = [];
  const { CATEGORY: catCol, NAME: nameCol, PERCENTAGE: pctCol } = COLUMN_LAYOUTS.DEMOGRAPHICS;

  for (let row = startRow; row <= MAX_ROWS.DATA; row++) {
    if (getCategory(getCellValue(sheet, `${catCol}${row}`)) !== category) {
      break;
    }

    const name = getCellValue(sheet, `${nameCol}${row}`);
    if (isHeaderValue(name)) {
      continue;
    }

    const nameStr = String(name).trim();
    if (!nameStr) {
      continue;
    }

    items.push({
      name: nameStr,
      percentage: parsePercentage(getCellValue(sheet, `${pctCol}${row}`)),
    });
  }

  // Sort by percentage, highest first, then by name.
  return items.sort((a, b) => b.percentage - a.percentage || a.name.localeCompare(b.name));
}

/**
 * @returns The audience breakdown, or undefined if the sheet is missing or cannot be read.
 */
export function parseDemographics(workbook: WorkBook): DemographicInsights | undefined {
  const sheet = findSheet(workbook, SHEET_NAMES.DEMOGRAPHICS);
  if (!sheet) {
    console.warn('DEMOGRAPHICS sheet not found');
    return undefined;
  }

  try {
    const demographics: DemographicInsights = {
      job_titles: [],
      locations: [],
      industries: [],
      seniority: [],
      company_size: [],
      companies: [],
    };

    // Find the first row of each category.
    const { CATEGORY: catCol } = COLUMN_LAYOUTS.DEMOGRAPHICS;
    const sectionStarts = new Map<Category, number>();
    for (let row = 1; row <= MAX_ROWS.DATA; row++) {
      const category = getCategory(getCellValue(sheet, `${catCol}${row}`));
      if (category && !sectionStarts.has(category)) {
        sectionStarts.set(category, row);
      }
    }

    for (const [category, startRow] of sectionStarts) {
      demographics[category] = parseCategoryRows(sheet, startRow, category);
    }

    return demographics;
  } catch (error) {
    console.error('Error parsing DEMOGRAPHICS sheet:', error);
    return undefined;
  }
}
