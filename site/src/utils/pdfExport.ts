/**
 * Utility to export story cards as a multi-page PDF
 *
 * Leverages the shared image export functionality:
 * 1. Use exportCardAsImage to capture each card as PNG (via html-to-image)
 * 2. Load the images and get their dimensions
 * 3. Combine all images into a single multi-page PDF using jsPDF
 * 4. One card = one page, ensuring all cards are exported
 *
 * Benefits:
 * - Reuses the same html-to-image logic for both PNG and PDF exports
 * - No duplicate styling/capture logic
 * - Cards are never stacked on screen during export
 * - Cleaner, more maintainable codebase
 */

import { exportCardAsImage } from './imageExport';

/**
 * Load jsPDF library dynamically
 */
async function loadJsPDF() {
  try {
    const module = await import('jspdf');
    return module.jsPDF;
  } catch (err) {
    throw new Error('jsPDF library is required for PDF export');
  }
}

/**
 * Export all cards as a multi-page PDF
 * Each card becomes one full page in the PDF
 *
 * Uses the shared image export functionality (exportCardAsImage) to capture each card,
 * avoiding duplicate styling logic and preventing cards from being stacked on screen.
 *
 * @param cardElements Array of card DOM elements to export
 * @param filename Optional filename for the PDF
 */
export async function exportCardsAsPDFFromImages(
  cardElements: HTMLElement[],
  filename: string = 'linkedin-wrapped.pdf'
): Promise<void> {
  if (!cardElements || cardElements.length === 0) {
    throw new Error('No cards provided for PDF export');
  }

  console.log(`Starting PDF export for ${cardElements.length} cards...`);

  const jsPDF = await loadJsPDF();

  try {
    // Initialize PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Process each card sequentially
    for (let i = 0; i < cardElements.length; i++) {
      const cardElement = cardElements[i];

      console.log(`Processing card ${i + 1}/${cardElements.length}...`);

      try {
        // Use shared image export functionality to capture the card as data URL
        const imageDataUrl = await exportCardAsImage(cardElement);

        // Create a temporary image to get dimensions
        const img = new Image();
        img.src = imageDataUrl;

        // Wait for image to load
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('Failed to load exported card image'));
        });

        // Get image dimensions
        const imgWidth = img.width;
        const imgHeight = img.height;
        const aspectRatio = imgHeight / imgWidth;

        // Calculate dimensions to fit on page while maintaining aspect ratio
        const maxWidth = pageWidth - 10; // 5mm margins on each side
        const maxHeight = pageHeight - 10;

        let pdfImageWidth = maxWidth;
        let pdfImageHeight = pdfImageWidth * aspectRatio;

        // If height exceeds page, scale down
        if (pdfImageHeight > maxHeight) {
          pdfImageHeight = maxHeight;
          pdfImageWidth = pdfImageHeight / aspectRatio;
        }

        // Center the image on the page
        const xPosition = (pageWidth - pdfImageWidth) / 2;
        const yPosition = (pageHeight - pdfImageHeight) / 2;

        // Add image to current page
        pdf.addImage(imageDataUrl, 'PNG', xPosition, yPosition, pdfImageWidth, pdfImageHeight);

        // Add new page for next card (except for the last one)
        if (i < cardElements.length - 1) {
          pdf.addPage();
        }
      } catch (cardError) {
        const errorMessage = cardError instanceof Error ? cardError.message : 'Unknown error';
        throw new Error(`Failed to export card ${i + 1}: ${errorMessage}`);
      }
    }

    // Save the PDF
    pdf.save(filename);
    console.log(`PDF saved as ${filename}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF export failed: ${errorMessage}`);
  }
}
