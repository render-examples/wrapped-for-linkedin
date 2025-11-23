/**
 * Utility to export story cards as a multi-page PDF
 *
 * Simple, maintainable approach:
 * 1. Capture each card directly using html2canvas
 * 2. Combine all captured images into a single multi-page PDF using jsPDF
 * 3. One card = one page, ensuring all 8 cards are exported
 *
 * Features:
 * - Direct card capture without intermediate image export
 * - Sharp corners (no border-radius) on exported cards
 * - No text highlighting or selection effects
 * - Clean, minimal code for easy maintenance
 * - All cards captured sequentially to single PDF
 */

/**
 * Load html2canvas library dynamically
 */
async function loadHtml2Canvas() {
  try {
    const module = await import('html2canvas');
    return module.default;
  } catch (err) {
    throw new Error('html2canvas library is required for PDF export');
  }
}

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
 * Prepare a card for capture by removing styling that hides it
 * and ensuring it renders with sharp corners and no text highlighting
 */
function prepareCardForCapture(cardElement: HTMLElement): () => void {
  // Save original styles for restoration
  const originalStyles = new Map<HTMLElement, Partial<CSSStyleDeclaration>>();
  const elementsToRestore: HTMLElement[] = [];

  // Make the card visible (in case it's hidden)
  const saveStyle = (el: HTMLElement) => {
    const saved: Partial<CSSStyleDeclaration> = {
      opacity: el.style.opacity,
      transform: el.style.transform,
      display: el.style.display,
      visibility: el.style.visibility,
      borderRadius: el.style.borderRadius,
      userSelect: (el.style as any).userSelect,
    };
    originalStyles.set(el, saved);
    elementsToRestore.push(el);
  };

  saveStyle(cardElement);

  // Make card visible for capture
  cardElement.style.opacity = '1';
  cardElement.style.transform = 'scale(1)';
  cardElement.style.display = 'block';
  cardElement.style.visibility = 'visible';

  // Remove border radius for sharp corners
  cardElement.style.borderRadius = '0';

  // Remove text selection effects
  cardElement.style.userSelect = 'none';

  // Also update all child elements to remove border-radius and text highlighting
  cardElement.querySelectorAll('*').forEach((el) => {
    const htmlEl = el as HTMLElement;
    saveStyle(htmlEl);
    htmlEl.style.borderRadius = '0';
    (htmlEl.style as any).userSelect = 'none';
  });

  // Return restoration function
  return () => {
    elementsToRestore.forEach((el) => {
      const saved = originalStyles.get(el);
      if (saved) {
        if (saved.opacity !== undefined) el.style.opacity = saved.opacity;
        if (saved.transform !== undefined) el.style.transform = saved.transform;
        if (saved.display !== undefined) el.style.display = saved.display;
        if (saved.visibility !== undefined) el.style.visibility = saved.visibility;
        if (saved.borderRadius !== undefined) el.style.borderRadius = saved.borderRadius;
        if (saved.userSelect !== undefined) (el.style as any).userSelect = saved.userSelect;
      }
    });
  };
}

/**
 * Capture a card element as a canvas
 */
async function captureCardAsCanvas(cardElement: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = await loadHtml2Canvas();

  const canvas = await html2canvas(cardElement, {
    scale: 2,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#0F0F0F',
    logging: false,
    windowHeight: cardElement.scrollHeight,
    windowWidth: cardElement.scrollWidth,
  });

  return canvas;
}

/**
 * Convert canvas to image data URL
 */
function canvasToImageDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png', 1);
}

/**
 * Export all cards as a multi-page PDF
 * Each card becomes one full page in the PDF
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
  await loadHtml2Canvas(); // Preload for later use

  try {
    // Initialize PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Process each card
    for (let i = 0; i < cardElements.length; i++) {
      const cardElement = cardElements[i];

      console.log(`Processing card ${i + 1}/${cardElements.length}...`);

      // Prepare card for capture
      const restore = prepareCardForCapture(cardElement);

      try {
        // Small delay to ensure styles are applied
        await new Promise(resolve => setTimeout(resolve, 50));

        // Capture card as canvas
        const canvas = await captureCardAsCanvas(cardElement);
        const imageDataUrl = canvasToImageDataUrl(canvas);

        // Get image dimensions
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
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
      } finally {
        // Always restore card styles
        restore();
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
