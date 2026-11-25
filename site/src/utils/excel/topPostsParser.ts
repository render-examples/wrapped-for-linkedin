/**
 * Parse the Top posts sheet. It has two tables side by side:
 * columns A to C list the top posts by engagements, and columns E to G list the top posts by impressions.
 * Each table has a URL, a publish date, and a value.
 */
import type { WorkBook } from 'xlsx';
import type { TopPost } from '@utils/excel/types';
import {
  parseDate,
  parseNumber,
  parseURL,
  findSheet,
  findRowWithKeywords,
  iterateRowsUntilEmpty,
  getRowValues,
} from '@utils/excel/utils';
import { SHEET_NAMES, COLUMN_LAYOUTS, HEADER_KEYWORDS, MAX_ROWS } from '@utils/excel/constants';

interface PostData {
  url: string;
  date: string;
  engagements: number;
  impressions: number;
}

type MetricType = 'engagements' | 'impressions';

interface MetricColumns {
  URL: string;
  DATE: string;
  VALUE: string;
}

/**
 * Add the metric from one table to the post with the same URL. Keep the higher value if the URL repeats.
 */
function addPostMetric(
  postsByUrl: Map<string, PostData>,
  columns: MetricColumns,
  rowValues: Record<string, unknown>,
  metricType: MetricType
): void {
  const url = parseURL(rowValues[columns.URL]);
  if (!url) return;

  const date = parseDate(rowValues[columns.DATE]);
  const metric = parseNumber(rowValues[columns.VALUE]);

  let post = postsByUrl.get(url);
  if (!post) {
    post = { url, date, engagements: 0, impressions: 0 };
    postsByUrl.set(url, post);
  }

  post[metricType] = Math.max(post[metricType], metric);
  if (!post.date && date) {
    post.date = date;
  }
}

/**
 * @returns The posts in sheet order: posts from the engagements table come first, by rank.
 * Returns an empty array if the sheet is missing or cannot be read.
 */
export function parseTopPosts(workbook: WorkBook): TopPost[] {
  const sheet = findSheet(workbook, SHEET_NAMES.TOP_POSTS);
  if (!sheet) {
    console.warn('Top posts sheet not found');
    return [];
  }

  try {
    const layout = COLUMN_LAYOUTS.TOP_POSTS;
    const headerRow = findRowWithKeywords(
      sheet,
      [layout.ENGAGEMENTS.URL, layout.ENGAGEMENTS.DATE],
      HEADER_KEYWORDS.URL
    );
    if (!headerRow) {
      console.warn('Could not find header row in top posts sheet');
      return [];
    }

    const allColumns = [...Object.values(layout.ENGAGEMENTS), ...Object.values(layout.IMPRESSIONS)];
    const postsByUrl = new Map<string, PostData>();

    for (const row of iterateRowsUntilEmpty(sheet, headerRow + 1, allColumns, MAX_ROWS.DATA)) {
      const values = getRowValues(sheet, row, allColumns);
      addPostMetric(postsByUrl, layout.ENGAGEMENTS, values, 'engagements');
      addPostMetric(postsByUrl, layout.IMPRESSIONS, values, 'impressions');
    }

    return Array.from(postsByUrl.values(), (post, index) => ({
      rank: index + 1,
      url: post.url,
      publish_date: post.date,
      engagements: post.engagements,
      impressions: post.impressions,
    }));
  } catch (error) {
    console.error('Error parsing Top posts sheet:', error);
    return [];
  }
}
