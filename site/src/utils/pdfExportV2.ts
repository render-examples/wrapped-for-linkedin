/**
 * Utility to export story cards as a multi-page PDF
 *
 * New approach:
 * 1. Export each card as PNG image (using existing exportCardAsImage)
 * 2. Store image blobs in memory
 * 3. Combine all images into a single multi-page PDF using jsPDF
 *
 * This approach is more modular and allows for better image quality control
 *
 * Features:
 * - All cards rendered (including hidden/inactive ones)
 * - All border-radius removed for sharp corners
 * - All highlighting effects removed (text selection, highlights)
 * - Gradient text converted to solid white
 * - Share buttons excluded
 * - Images stored in memory as base64 data URLs
 * - All images combined into single multi-page PDF
 */

import { exportCardAsImage } from './imageExport';

/**
 * Temporarily make a card element visible for export
 * Overrides opacity, transform, and styling that hides inactive cards
 * Also removes border-radius for sharp corners
 */
function makeCardVisibleForExport(cardElement: HTMLElement): () => void {
  // Save original styles
  const originalStyles = {
    opacity: cardElement.style.opacity,
    transform: cardElement.style.transform,
    pointerEvents: cardElement.style.pointerEvents,
    zIndex: cardElement.style.zIndex,
    visibility: cardElement.style.visibility,
    borderRadius: cardElement.style.borderRadius,
    display: cardElement.style.display,
  };

  // Make card fully visible
  cardElement.style.opacity = '1';
  cardElement.style.transform = 'scale(1)';
  cardElement.style.pointerEvents = 'auto';
  cardElement.style.zIndex = '10';
  cardElement.style.visibility = 'visible';
  cardElement.style.display = 'block';
  cardElement.style.borderRadius = '0 !important'; // Sharp corners

  // Also remove border-radius from child elements
  const childrenWithBorderRadius = cardElement.querySelectorAll('[style*="border-radius"]');
  const savedChildStyles: { element: Element; borderRadius: string }[] = [];

  childrenWithBorderRadius.forEach(child => {
    const childElement = child as HTMLElement;
    savedChildStyles.push({
      element: childElement,
      borderRadius: childElement.style.borderRadius,
    });
    childElement.style.borderRadius = '0 !important';
  });

  // Also remove via CSS classes by injecting a temporary style
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    [data-export-card] * {
      border-radius: 0 !important;
    }
  `;
  document.head.appendChild(styleSheet);
  cardElement.setAttribute('data-export-card', 'true');

  // Return restoration function
  return () => {
    // Restore original styles on card
    cardElement.style.opacity = originalStyles.opacity;
    cardElement.style.transform = originalStyles.transform;
    cardElement.style.pointerEvents = originalStyles.pointerEvents;
    cardElement.style.zIndex = originalStyles.zIndex;
    cardElement.style.visibility = originalStyles.visibility;
    cardElement.style.borderRadius = originalStyles.borderRadius;
    cardElement.style.display = originalStyles.display;

    // Restore original styles on children
    savedChildStyles.forEach(({ element, borderRadius }) => {
      (element as HTMLElement).style.borderRadius = borderRadius;
    });

    // Remove data attribute and temporary stylesheet
    cardElement.removeAttribute('data-export-card');
    if (styleSheet.parentNode) {
      styleSheet.parentNode.removeChild(styleSheet);
    }
  };
}

let jsPDFLib: any = null;

/**
 * Dynamically load jsPDF
 */
async function loadJsPDF() {
  try {
    if (!jsPDFLib) {
      const pdfModule = await import('jspdf');
      jsPDFLib = pdfModule.jsPDF;
    }
  } catch (err) {
    throw new Error('Failed to load jsPDF library');
  }
}

/**
 * Convert a Blob to a Data URL (base64)
 */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Get image dimensions from a data URL
 */
function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Export cards as PNG images and store in memory
 * Temporarily makes each card visible during export
 * @param cardElements Array of card DOM elements to export as images
 * @returns Array of image data URLs
 */
export async function exportCardsAsImageBlobs(
  cardElements: HTMLElement[]
): Promise<string[]> {
  const imageDataUrls: string[] = [];

  for (let i = 0; i < cardElements.length; i++) {
    try {
      console.log(`Exporting card ${i + 1}/${cardElements.length} as image...`);

      const cardElement = cardElements[i];

      // Make card visible for export (sharp corners)
      const restoreCard = makeCardVisibleForExport(cardElement);

      try {
        // Wait a bit for visibility changes to take effect
        await new Promise(resolve => setTimeout(resolve, 100));

        // Export card as PNG blob
        const imageBlob = await exportCardAsImage(cardElement);

        // Convert blob to data URL
        const dataUrl = await blobToDataUrl(imageBlob);
        imageDataUrls.push(dataUrl);
      } finally {
        // Restore card to original state
        restoreCard();
      }
    } catch (err) {
      console.error(`Failed to export card ${i + 1} as image:`, err);
      throw new Error(`Failed to export card ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return imageDataUrls;
}

/**
 * Combine multiple image data URLs into a single multi-page PDF
 * Similar to PIL's Image.save with append_images
 * @param imageDataUrls Array of PNG image data URLs
 * @param filename Optional filename for the PDF
 */
export async function combineImagesIntoPDF(
  imageDataUrls: string[],
  filename: string = 'linkedin-wrapped.pdf'
): Promise<void> {
  if (!imageDataUrls || imageDataUrls.length === 0) {
    throw new Error('No images provided for PDF creation');
  }

  await loadJsPDF();

  try {
    if (!jsPDFLib) {
      throw new Error('Failed to load jsPDF library');
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

    // Add each image to the PDF
    for (let i = 0; i < imageDataUrls.length; i++) {
      try {
        const imageDataUrl = imageDataUrls[i];

        console.log(`Adding image ${i + 1}/${imageDataUrls.length} to PDF...`);

        // Get image dimensions
        const { width: imgWidth, height: imgHeight } = await getImageDimensions(imageDataUrl);
        const aspectRatio = imgHeight / imgWidth;

        // Calculate dimensions to fit on page while maintaining aspect ratio
        const maxWidth = pageWidth - 2 * margin;
        const maxHeight = pageHeight - 2 * margin;

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
        PDF.addImage(imageDataUrl, 'PNG', xPosition, yPosition, pdfImageWidth, pdfImageHeight);

        // Add new page for next image (except for the last one)
        if (i < imageDataUrls.length - 1) {
          PDF.addPage();
        }
      } catch (err) {
        console.error(`Failed to add image ${i + 1} to PDF:`, err);
        throw new Error(`Failed to add image ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    // Save the PDF
    PDF.save(filename);
    console.log(`PDF saved as ${filename}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to combine images into PDF: ${errorMessage}`);
  }
}

/**
 * Export all cards as a multi-page PDF in one step
 *
 * This is the main export function that:
 * 1. Exports each card as a PNG image
 * 2. Stores images in memory (as data URLs)
 * 3. Combines all images into a single multi-page PDF
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

  try {
    console.log(`Starting PDF export process for ${cardElements.length} cards...`);

    // Step 1: Export all cards as images and store in memory
    console.log('Step 1: Exporting cards as images...');
    const imageDataUrls = await exportCardsAsImageBlobs(cardElements);
    console.log(`Successfully exported ${imageDataUrls.length} images`);

    // Step 2: Combine images into PDF
    console.log('Step 2: Combining images into PDF...');
    await combineImagesIntoPDF(imageDataUrls, filename);

    console.log('PDF export completed successfully');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to export cards as PDF: ${errorMessage}`);
  }
}
