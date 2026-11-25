/**
 * Format numbers, dates, and the Wrapped year for display.
 */

/**
 * Format a large number with a K or M suffix, for example 1500000 as "1.5M".
 */
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(num % 1000000 === 0 ? 0 : 1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(num % 1000 === 0 ? 0 : 1) + 'K';
  }
  return num.toString();
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
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
): string {
  const dateObj = typeof date === 'string' ? parseISODate(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
}

/**
 * Format a date string as "January 15, 2024". Returns the input if it is not a valid date.
 */
export function formatDateString(dateStr: string): string {
  if (!dateStr) return dateStr;
  const date = new Date(dateStr);
  return isNaN(date.getTime())
    ? dateStr
    : date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Get the year of the export end date. Use the current year if the end date is missing.
 */
export function getWrappedYear(discovery: { end_date?: string } | undefined): number {
  const year = parseInt(discovery?.end_date?.split('-')[0] ?? '', 10);
  return isNaN(year) ? new Date().getFullYear() : year;
}
