/**
 * Format numbers, dates, and the Wrapped year for display.
 */

/**
 * Format a large number with a K or M suffix and one decimal, for example 1500000 as "1.5M".
 * A trailing ".0" is removed. A value that rounds to 1000K shows as "1M".
 */
export function formatNumber(num: number): string {
  if (num < 1000) {
    return num.toString();
  }
  // Template strings drop a trailing ".0", for example `${1.0}` is "1".
  const thousands = Math.round(num / 100) / 10;
  if (thousands < 1000) {
    return `${thousands}K`;
  }
  return `${Math.round(num / 100_000) / 10}M`;
}

// Parse an ISO date (YYYY-MM-DD) as a local date, so the day does not change with the time zone.
function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a Date or an ISO date string, by default as "January 15, 2024".
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' },
): string {
  const dateObj = typeof date === 'string' ? parseISODate(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format an ISO date (YYYY-MM-DD) as "January 15, 2024". Returns other values as is.
 */
export function formatDateString(dateStr: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? formatDate(dateStr) : dateStr;
}

/**
 * Get the year of the export end date. Use the current year if the end date is missing.
 */
export function getWrappedYear(discovery: { end_date?: string } | undefined): number {
  const year = parseInt(discovery?.end_date?.split('-')[0] ?? '', 10);
  return isNaN(year) ? new Date().getFullYear() : year;
}
