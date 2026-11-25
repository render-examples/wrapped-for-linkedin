import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { processExcelFile } from '@utils/excel/excelProcessor';
import { BADGES, getEarnedBadges } from '@utils/badges';

describe('fixtures/all-badges.xlsx', () => {
  it('earns every badge', async () => {
    // The app tsconfig has no Node types, so read the file with xlsx instead of node:fs.
    const path = decodeURIComponent(new URL('../../fixtures/all-badges.xlsx', import.meta.url).pathname);
    const bytes = XLSX.write(XLSX.readFile(path), { type: 'array', bookType: 'xlsx' });
    const data = await processExcelFile(new File([bytes], 'all-badges.xlsx'));

    expect(getEarnedBadges(data).map((badge) => badge.id)).toEqual(
      BADGES.map((badge) => badge.id),
    );
  });
});
