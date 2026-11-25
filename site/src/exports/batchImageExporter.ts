/**
 * Export several cards as PNG images in parallel batches.
 */

import { exportCardAsImage } from '@exports/imageExport';

const DEFAULT_CONCURRENCY = 8;

export interface BatchExportOptions {
  concurrency?: number;
  onProgress?: (current: number, total: number) => void;
  // Data URL of the post screenshot for the Peak Performer card, or null to show the fallback.
  postImage?: string | null;
}

/**
 * Export cards as images, a batch at a time.
 * @returns Image data URLs in the same order as the cards.
 */
export async function exportCardsAsImagesBatch(
  cardElements: HTMLElement[],
  options: BatchExportOptions = {}
): Promise<string[]> {
  const { concurrency = DEFAULT_CONCURRENCY, onProgress, postImage = null } = options;

  if (!cardElements || cardElements.length === 0) {
    throw new Error('No cards provided for batch export');
  }

  const results: (string | Error)[] = new Array(cardElements.length);
  let processedCount = 0;

  for (let i = 0; i < cardElements.length; i += concurrency) {
    const batch = cardElements.slice(i, i + concurrency);

    await Promise.all(
      batch.map(async (cardElement, offset) => {
        const index = i + offset;
        try {
          results[index] = await exportCardAsImage(cardElement, { postImage });
        } catch (error) {
          results[index] = error instanceof Error ? error : new Error('Unknown error');
        }
        processedCount++;
        onProgress?.(processedCount, cardElements.length);
      })
    );
  }

  const errors = results.filter((r): r is Error => r instanceof Error);
  if (errors.length > 0) {
    throw new Error(`Batch image export failed: ${errors.length} card(s) failed to render: ${errors[0].message}`);
  }

  return results as string[];
}
