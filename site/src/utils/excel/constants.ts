/**
 * Constants for Excel parsing.
 */

// The maximum number of rows to scan.
export const MAX_ROWS = {
  // When looking for a header row.
  HEADER_SCAN: 20,
  // When reading data rows.
  DATA: 1000,
};

// Stop reading data after this many empty rows in a row.
export const CONSECUTIVE_EMPTY_ROWS = 5;

// Sheet names that LinkedIn uses. The match is not case-sensitive.
export const SHEET_NAMES = {
  DISCOVERY: ['DISCOVERY'],
  TOP_POSTS: ['Top posts', 'TOP POSTS'],
  FOLLOWERS: ['FOLLOWERS'],
  DEMOGRAPHICS: ['DEMOGRAPHICS'],
  ENGAGEMENT: ['ENGAGEMENT'],
};

export const COLUMN_LAYOUTS = {
  // The Top posts sheet has two tables side by side: top posts by engagements and by impressions.
  TOP_POSTS: {
    ENGAGEMENTS: {
      URL: 'A',
      DATE: 'B',
      VALUE: 'C',
    },
    IMPRESSIONS: {
      URL: 'E',
      DATE: 'F',
      VALUE: 'G',
    },
  },
  ENGAGEMENT: {
    DATE: 'A',
    IMPRESSIONS: 'B',
    ENGAGEMENTS: 'C',
  },
  DEMOGRAPHICS: {
    CATEGORY: 'A',
    NAME: 'B',
    PERCENTAGE: 'C',
  },
  FOLLOWERS: {
    NEW_FOLLOWERS: 'B',
  },
};

// Keywords that find header rows.
export const HEADER_KEYWORDS = {
  URL: ['url'],
  DATE: ['date'],
};

// The value for a "< 1%" percentage.
export const MIN_PERCENTAGE = 0.0001;

// Days from the Excel epoch to the Unix epoch.
export const EXCEL_DATE_OFFSET = 25569;
export const MS_PER_DAY = 86400 * 1000;
