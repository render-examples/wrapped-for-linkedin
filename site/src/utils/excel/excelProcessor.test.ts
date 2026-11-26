import { describe, expect, it, vi } from 'vitest';
import * as XLSX from 'xlsx';
import { processExcelFile } from '@utils/excel/excelProcessor';

const NOT_AN_EXPORT = 'This file is not a LinkedIn analytics export.';

function workbookFile(sheetName: string): File {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['a', 'b']]), sheetName);
  return new File([XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })], 'book.xlsx');
}

describe('processExcelFile', () => {
  it('rejects an empty file', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(processExcelFile(new File([], 'empty.xlsx'))).rejects.toThrow(NOT_AN_EXPORT);
  });

  it('rejects a text file renamed to .xlsx', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const file = new File(['hello, this is not a spreadsheet'], 'notes.xlsx');
    await expect(processExcelFile(file)).rejects.toThrow(NOT_AN_EXPORT);
  });

  it('rejects a workbook with no LinkedIn sheets', async () => {
    await expect(processExcelFile(workbookFile('Budget'))).rejects.toThrow(NOT_AN_EXPORT);
  });

  it('reads a workbook with a LinkedIn sheet', async () => {
    await expect(processExcelFile(workbookFile('DISCOVERY'))).resolves.toBeDefined();
  });
});
