/**
 * Utility to extract and manage the wrapped year
 */

import type { ParsedExcelData } from './excel/types';

/**
 * Extract the year from discovery data
 * @param discovery - Discovery metrics data
 * @returns The year as a number, or null if data is unavailable
 */
export function extractYearFromDiscovery(discovery: ParsedExcelData['discovery_data']): number | null {
  if (!discovery?.end_date) {
    return null;
  }

  try {
    const year = parseInt(discovery.end_date.split('-')[0]);
    if (!isNaN(year)) {
      return year;
    }
  } catch (error) {
    console.error('Failed to extract year from discovery data:', error);
  }

  return null;
}

/**
 * Get the current wrapped year, with a fallback to current year
 * @param discovery - Discovery metrics data
 * @returns The year, or current year as fallback
 */
export function getWrappedYear(discovery: ParsedExcelData['discovery_data']): number {
  const extractedYear = extractYearFromDiscovery(discovery);
  return extractedYear ?? new Date().getFullYear();
}
