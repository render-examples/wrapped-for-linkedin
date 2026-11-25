/**
 * Export several cards as PNG images in parallel batches.
 */

import { exportCardAsImage } from '@exports/imageExport';

const DEFAULT_CONCURRENCY = 8;

interface BatchExportOptions {
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

  if (cardElements.length === 0) {
    throw new Error('No cards provided for batch export');
  }

  const results: PromiseSettledResult<string>[] = [];
  let processedCount = 0;

  for (let i = 0; i < cardElements.length; i += concurrency) {
    const batch = cardElements.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(async (cardElement) => {
        try {
          return await exportCardAsImage(cardElement, { postImage });
        } finally {
          processedCount++;
          onProgress?.(processedCount, cardElements.length);
        }
      })
    );
    results.push(...batchResults);
  }

  const failures = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected');
  if (failures.length > 0) {
    const firstMessage = failures[0].reason instanceof Error ? failures[0].reason.message : 'Unknown error';
    throw new Error(`Batch image export failed: ${failures.length} card(s) failed to render: ${firstMessage}`);
  }

  return results.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []));
}
