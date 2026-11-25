/**
 * Export story cards as a multi-page PDF.
 *
 * Each card is rendered to a PNG with exportCardAsImage, then placed on its own
 * page. The page has the same aspect ratio as the card, so the card fills the
 * page with no margin.
 */

import { exportCardsAsImagesBatch } from '@exports/batchImageExporter';
import { EXPORT_HEIGHT, EXPORT_WIDTH } from '@exports/imageExport';

const PDF_PAGE_WIDTH_MM = 216;
const PDF_PAGE_HEIGHT_MM = (PDF_PAGE_WIDTH_MM * EXPORT_HEIGHT) / EXPORT_WIDTH;

async function loadJsPDF() {
  try {
    const module = await import('jspdf');
    return module.jsPDF;
  } catch {
    throw new Error('jsPDF library is required for PDF export');
  }
}

export interface PDFExportOptions {
  // Data URL of the post screenshot for the Peak Performer card, or null to show the fallback.
  postImage?: string | null;
}

/**
 * Build one PDF of all cards, one card per page. The caller saves or shares the Blob.
 */
export async function buildCardsPDF(
  cardElements: HTMLElement[],
  options: PDFExportOptions = {}
): Promise<Blob> {
  if (cardElements.length === 0) {
    throw new Error('No cards provided for PDF export');
  }

  const jsPDF = await loadJsPDF();

  try {
    const imageDataUrls = await exportCardsAsImagesBatch(cardElements, {
      postImage: options.postImage,
    });

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM],
      compress: true,
    });

    imageDataUrls.forEach((dataUrl, index) => {
      if (index > 0) {
        pdf.addPage([PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM], 'portrait');
      }
      pdf.addImage(dataUrl, 'PNG', 0, 0, PDF_PAGE_WIDTH_MM, PDF_PAGE_HEIGHT_MM, undefined, 'FAST');
    });

    return pdf.output('blob');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF export failed: ${errorMessage}`);
  }
}
