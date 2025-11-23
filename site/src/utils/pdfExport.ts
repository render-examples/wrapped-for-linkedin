/**
 * Utility to export story cards as a PDF document
 * Uses jsPDF with html2canvas for rendering
 */

let jsPDFLib: any = null;
let html2canvas: any = null;

/**
 * Dynamically load jsPDF and html2canvas
 */
async function loadLibraries() {
  try {
    if (!jsPDFLib) {
      const pdfModule = await import('jspdf');
      jsPDFLib = pdfModule.jsPDF;
    }

    if (!html2canvas) {
      const canvasModule = await import('html2canvas');
      html2canvas = canvasModule.default;
    }
  } catch (err) {
    throw new Error('Failed to load PDF export libraries');
  }
}

/**
 * Create a printable clone of a card with all visual styles rendered
 */
function createPrintableClone(cardElement: HTMLElement): HTMLElement {
  const clone = cardElement.cloneNode(true) as HTMLElement;

  // Remove interactive elements
  const shareButtons = clone.querySelectorAll('.share-button-wrapper, .share-button, [class*="share"]');
  shareButtons.forEach(btn => btn.remove());

  // Fix gradient text on metric values - replace gradient with solid white
  const metricValues = clone.querySelectorAll('.metric-value');
  metricValues.forEach(el => {
    const element = el as HTMLElement;
    // Remove gradient background
    element.style.background = 'transparent !important';
    element.style.backgroundClip = 'unset !important';
    element.style.setProperty('-webkit-background-clip', 'unset', 'important');
    element.style.setProperty('-webkit-text-fill-color', 'unset', 'important');
    // Set solid white text color
    element.style.color = 'rgba(255, 255, 255, 0.95) !important';
  });

  // Fix card-title gradient if present
  const cardTitles = clone.querySelectorAll('.card-title');
  cardTitles.forEach(el => {
    const element = el as HTMLElement;
    element.style.background = 'transparent !important';
    element.style.backgroundClip = 'unset !important';
    element.style.setProperty('-webkit-background-clip', 'unset', 'important');
    element.style.setProperty('-webkit-text-fill-color', 'unset', 'important');
    element.style.color = 'rgba(255, 255, 255, 0.95) !important';
  });

  // Fix engagement values
  const engagementValues = clone.querySelectorAll('.engagement-value');
  engagementValues.forEach(el => {
    const element = el as HTMLElement;
    element.style.background = 'transparent !important';
    element.style.backgroundClip = 'unset !important';
    element.style.setProperty('-webkit-background-clip', 'unset', 'important');
    element.style.setProperty('-webkit-text-fill-color', 'unset', 'important');
    element.style.color = 'rgba(255, 255, 255, 0.95) !important';
  });

  return clone;
}

/**
 * Render a card clone to canvas with proper styling
 */
async function renderCardToCanvas(
  cardElement: HTMLElement,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const clone = createPrintableClone(cardElement);

  // Set up clone styling for consistent rendering
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;
  clone.style.margin = '0';
  clone.style.padding = window.getComputedStyle(cardElement).padding;
  clone.style.boxSizing = 'border-box';
  clone.style.position = 'relative';
  clone.style.display = 'block';

  // Create temporary container positioned off-screen but visible for rendering
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = `${width}px`;
  container.style.height = `${height}px`;
  container.style.zIndex = '-1';
  container.style.pointerEvents = 'none';
  container.style.visibility = 'visible'; // Keep visible for rendering

  container.appendChild(clone);
  document.body.appendChild(container);

  try {
    // Render using html2canvas with higher scale for better quality
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0F0F0F',
      logging: false,
      width: width,
      height: height,
      windowHeight: height,
      windowWidth: width,
      imageTimeout: 5000,
    });

    return canvas;
  } finally {
    // Clean up container
    if (document.body.contains(container)) {
      document.body.removeChild(container);
    }
  }
}

/**
 * Extract card element from viewport, handling inactive cards
 * Temporarily makes the card visible for capture if needed
 */
function extractVisibleCard(cardElement: HTMLElement): { element: HTMLElement; restored: () => void } {
  const originalOpacity = cardElement.style.opacity;
  const originalTransform = cardElement.style.transform;
  const originalPointerEvents = cardElement.style.pointerEvents;
  const originalZIndex = cardElement.style.zIndex;

  // Temporarily make the card fully visible for rendering
  cardElement.style.opacity = '1';
  cardElement.style.transform = 'scale(1)';
  cardElement.style.pointerEvents = 'auto';
  cardElement.style.zIndex = '10';

  // Return restoration function to put card back to original state
  const restored = () => {
    cardElement.style.opacity = originalOpacity;
    cardElement.style.transform = originalTransform;
    cardElement.style.pointerEvents = originalPointerEvents;
    cardElement.style.zIndex = originalZIndex;
  };

  return { element: cardElement, restored };
}

/**
 * Export all story cards as a PDF document
 * One page per card, sized to fit the page
 *
 * @param cardElements Array of card DOM elements to export
 * @param filename Optional filename for the PDF (default: linkedin-wrapped.pdf)
 */
export async function exportCardsAsPDF(
  cardElements: HTMLElement[],
  filename: string = 'linkedin-wrapped.pdf'
): Promise<void> {
  if (!cardElements || cardElements.length === 0) {
    throw new Error('No cards provided for PDF export');
  }

  await loadLibraries();

  try {
    if (!jsPDFLib || !html2canvas) {
      throw new Error('Failed to load required libraries');
    }

    // Initialize PDF with A4 dimensions
    const PDF = new jsPDFLib({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = PDF.internal.pageSize.getWidth();
    const pageHeight = PDF.internal.pageSize.getHeight();
    const margin = 10; // 10mm margins

    // Process each card on its own page
    for (let i = 0; i < cardElements.length; i++) {
      const cardElement = cardElements[i];

      try {
        // Temporarily make card fully visible for rendering
        const { restored } = extractVisibleCard(cardElement);

        try {
          // Get dimensions
          const rect = cardElement.getBoundingClientRect();
          const width = Math.ceil(rect.width || 400);
          const height = Math.ceil(rect.height || 600);

          // Render card to canvas
          const canvas = await renderCardToCanvas(cardElement, width, height);

          // Calculate dimensions to fit on page while maintaining aspect ratio
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 2 * margin;

          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const aspectRatio = canvasHeight / canvasWidth;

          let imageWidth = maxWidth;
          let imageHeight = imageWidth * aspectRatio;

          // If height exceeds page, scale down
          if (imageHeight > maxHeight) {
            imageHeight = maxHeight;
            imageWidth = imageHeight / aspectRatio;
          }

          // Center the image on the page
          const xPosition = (pageWidth - imageWidth) / 2;
          const yPosition = (pageHeight - imageHeight) / 2;

          // Convert canvas to image data
          const imageData = canvas.toDataURL('image/png');

          // Add image to PDF
          PDF.addImage(imageData, 'PNG', xPosition, yPosition, imageWidth, imageHeight);

          // Add new page for next card (except for the last card)
          if (i < cardElements.length - 1) {
            PDF.addPage();
          }
        } finally {
          // Restore card to its original state
          restored();
        }
      } catch (err) {
        console.error(`Failed to export card ${i + 1}:`, err);
        // Continue with next card even if one fails
      }
    }

    // Save the PDF
    PDF.save(filename);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to export cards as PDF: ${errorMessage}`);
  }
}

/**
 * Export a single card as PDF (wrapper for single card case)
 */
export async function exportCardAsPDF(
  cardElement: HTMLElement,
  filename: string = 'linkedin-wrapped-card.pdf'
): Promise<void> {
  return exportCardsAsPDF([cardElement], filename);
}

/**
 * Callback function type for auto-play export
 * Called whenever a new card is displayed during export
 */
export type AutoPlayExportCallback = (cardElement: HTMLElement, cardIndex: number) => Promise<void>;

/**
 * Create a callback for collecting cards during auto-play export
 * Returns a function to pass as a callback during auto-play, and a function to get collected cards
 */
export function createAutoPlayExportCollector() {
  const cardSnapshots: HTMLCanvasElement[] = [];

  const collectCard = async (cardElement: HTMLElement, cardIndex: number): Promise<void> => {
    try {
      // Get dimensions
      const rect = cardElement.getBoundingClientRect();
      const width = Math.ceil(rect.width || 400);
      const height = Math.ceil(rect.height || 600);

      // Wait a bit to ensure all animations are complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Render card to canvas
      const canvas = await renderCardToCanvas(cardElement, width, height);
      cardSnapshots[cardIndex] = canvas;
    } catch (err) {
      console.error(`Failed to capture card ${cardIndex + 1}:`, err);
    }
  };

  const generatePDF = async (filename: string = 'linkedin-wrapped.pdf'): Promise<void> => {
    if (cardSnapshots.length === 0) {
      throw new Error('No cards were captured during export');
    }

    await loadLibraries();

    try {
      if (!jsPDFLib) {
        throw new Error('Failed to load required libraries');
      }

      // Initialize PDF with A4 dimensions
      const PDF = new jsPDFLib({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = PDF.internal.pageSize.getWidth();
      const pageHeight = PDF.internal.pageSize.getHeight();
      const margin = 10; // 10mm margins

      // Add all captured cards to PDF
      for (let i = 0; i < cardSnapshots.length; i++) {
        const canvas = cardSnapshots[i];

        if (!canvas) {
          console.warn(`Card ${i + 1} snapshot is missing, skipping`);
          continue;
        }

        try {
          // Calculate dimensions to fit on page while maintaining aspect ratio
          const maxWidth = pageWidth - 2 * margin;
          const maxHeight = pageHeight - 2 * margin;

          const canvasWidth = canvas.width;
          const canvasHeight = canvas.height;
          const aspectRatio = canvasHeight / canvasWidth;

          let imageWidth = maxWidth;
          let imageHeight = imageWidth * aspectRatio;

          // If height exceeds page, scale down
          if (imageHeight > maxHeight) {
            imageHeight = maxHeight;
            imageWidth = imageHeight / aspectRatio;
          }

          // Center the image on the page
          const xPosition = (pageWidth - imageWidth) / 2;
          const yPosition = (pageHeight - imageHeight) / 2;

          // Convert canvas to image data
          const imageData = canvas.toDataURL('image/png');

          // Add image to PDF
          PDF.addImage(imageData, 'PNG', xPosition, yPosition, imageWidth, imageHeight);

          // Add new page for next card (except for the last card)
          if (i < cardSnapshots.length - 1) {
            PDF.addPage();
          }
        } catch (err) {
          console.error(`Failed to add card ${i + 1} to PDF:`, err);
        }
      }

      // Save the PDF
      PDF.save(filename);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate PDF: ${errorMessage}`);
    }
  };

  return { collectCard, generatePDF };
}
