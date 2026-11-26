/**
 * Read a LinkedIn analytics Excel export and run each sheet parser.
 * The file stays in the browser. Each sheet is optional, so the result can be partial.
 */
import * as XLSX from 'xlsx';
import type { ParsedExcelData } from '@utils/excel/types';
import { parseDiscovery } from '@utils/excel/discoveryParser';
import { parseTopPosts } from '@utils/excel/topPostsParser';
import { parseDemographics } from '@utils/excel/demographicsParser';
import {
  parseEngagement,
  calculateTotalEngagements,
  calculateMedianDailyImpressions,
} from '@utils/excel/engagementParser';
import { parseFollowers } from '@utils/excel/followersParser';
import { SHEET_NAMES } from '@utils/excel/constants';
import { findSheet } from '@utils/excel/utils';

const KNOWN_SHEETS = Object.values(SHEET_NAMES);

/**
 * @throws An Error with a message for the user if the file is not a LinkedIn analytics export.
 */
export async function processExcelFile(file: File): Promise<ParsedExcelData> {
  let workbook: XLSX.WorkBook;
  try {
    // Parse only the sheets the app uses.
    workbook = XLSX.read(await file.arrayBuffer(), {
      type: 'array',
      sheets: KNOWN_SHEETS.flat(),
      cellFormula: false,
      cellHTML: false,
    });
  } catch (error) {
    console.error('Error reading Excel file:', error);
    throw new Error(
      'This file could not be read. Upload the .xlsx file that you exported from LinkedIn.',
    );
  }

  if (!KNOWN_SHEETS.some((names) => findSheet(workbook, names))) {
    throw new Error('This file is not a LinkedIn analytics export.');
  }

  try {
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
        discoveryData.median_daily_impressions = Math.round(
          calculateMedianDailyImpressions(engagementByDay),
        );
      }
    }

    return parsedData;
  } catch (error) {
    console.error('Error processing Excel file:', error);
    throw new Error(
      'The data in this file could not be read. Export the file from LinkedIn again and upload it.',
    );
  }
}
