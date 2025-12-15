/**
 * Shared formatting utilities for numbers, dates, and other data
 */

// ============================================================================
// NUMBER FORMATTERS
// ============================================================================

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

// ============================================================================
// DATE FORMATTERS
// ============================================================================

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

/**
 * Format a date string as a readable date (e.g., "January 15, 2024")
 */
export const formatDateString = (dateStr: string): string => {
  if (!dateStr) return dateStr;
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? dateStr
      : date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
  } catch {
    return dateStr;
  }
};

/**
 * Format a timestamp as a full date string
 */
export const formatFullDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format a timestamp as relative time (e.g., "2 days ago")
 */
export const formatRelativeTime = (timestamp: number): string => {
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
  return 'Just now';
};

// ============================================================================
// WRAPPED-SPECIFIC UTILITIES
// ============================================================================

/**
 * Extract the year from discovery data
 * @param discovery - Discovery metrics data
 * @returns The year as a number, or null if data is unavailable
 */
export function extractYearFromDiscovery(discovery: { end_date?: string } | undefined): number | null {
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
export function getWrappedYear(discovery: { end_date?: string } | undefined): number {
  const extractedYear = extractYearFromDiscovery(discovery);
  return extractedYear ?? new Date().getFullYear();
}
