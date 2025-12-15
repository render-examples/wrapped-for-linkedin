/**
 * Shared formatting utilities for numbers, dates, and other data
 */

/**
 * Format large numbers for display (e.g., 1500000 -> 1.5M)
 * @param num - The number to format
 * @returns Formatted string with K/M suffix
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

/**
 * Parse an ISO date string safely to avoid timezone issues
 * @param dateString - ISO date string (YYYY-MM-DD)
 * @returns Date object in local timezone
 */
export function parseISODate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Format a date for display
 * @param date - Date object or ISO string
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric', year: 'numeric' }
): string {
  const dateObj = typeof date === 'string' ? parseISODate(date) : date;
  return dateObj.toLocaleDateString('en-US', options);
}

