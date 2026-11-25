/**
 * Read a LinkedIn analytics Excel export and run each sheet parser.
 * The file stays in the browser. Each sheet is optional, so the result can be partial.
 */
import * as XLSX from 'xlsx';
import type { ParsedExcelData } from '@utils/excel/types';
import { parseDiscovery } from '@utils/excel/discoveryParser';
import { parseTopPosts } from '@utils/excel/topPostsParser';
import { parseDemographics } from '@utils/excel/demographicsParser';
import { parseEngagement, calculateTotalEngagements, calculateMedianDailyImpressions } from '@utils/excel/engagementParser';
import { parseFollowers } from '@utils/excel/followersParser';

/**
 * @throws An Error if the file is not a valid Excel file.
 */
export async function processExcelFile(file: File): Promise<ParsedExcelData> {
  try {
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      throw new Error('Invalid Excel file: no sheets found');
    }

    const parsedData: ParsedExcelData = {};

    let discoveryData = parseDiscovery(workbook);

    const newFollowers = parseFollowers(workbook);
    if (newFollowers !== undefined) {
      // Without a DISCOVERY sheet, keep only the follower count.
      discoveryData ??= { start_date: '', end_date: '', total_impressions: 0, members_reached: 0 };
      discoveryData.new_followers = newFollowers;
    }
    if (discoveryData) {
      parsedData.discovery_data = discoveryData;
    }

    const topPosts = parseTopPosts(workbook);
    if (topPosts.length > 0) {
      parsedData.top_posts = topPosts;
    }

    const demographics = parseDemographics(workbook);
    if (demographics) {
      parsedData.demographics = demographics;
    }

    const engagementByDay = parseEngagement(workbook);
    if (engagementByDay.length > 0) {
      parsedData.engagement_by_day = engagementByDay;
      // The daily rows replace the DISCOVERY sheet values for these two metrics.
      if (discoveryData) {
        discoveryData.total_engagements = calculateTotalEngagements(engagementByDay);
        discoveryData.average_impressions_per_day = Math.round(calculateMedianDailyImpressions(engagementByDay));
      }
    }

    return parsedData;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(
      `Failed to process Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
