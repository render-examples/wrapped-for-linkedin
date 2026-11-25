# Export system

The export system turns story cards into PNG images and a multi-page PDF. The browser renders the files. Only the post screenshot comes from the screenshot service.

## Files

| File | Purpose |
| --- | --- |
| `imageExport.ts` | Exports one card as a PNG with html-to-image. |
| `imageCache.ts` | Keeps recent PNGs in memory, so an unchanged card is not rendered again. |
| `batchImageExporter.ts` | Exports several cards in parallel batches. |
| `pdfExport.ts` | Puts the PNGs into a PDF, one card per page. |
| `postScreenshot.ts` | Gets a screenshot of the top post from the screenshot service. |

## Single card: `imageExport.ts`

`exportCardAsImage(element, { backgroundColor?, postImage? })` returns a PNG data URL.

The PNG is 1080 × 1350 on every device. The function lays out a clone of the card at 432 × 540 CSS pixels and renders it at a pixel ratio of 2.5. The clone gets the `story-card-export` class, which the stylesheet uses for export-only layout.

The function does these steps:

1. Check the cache. The cache key uses the card `id` or a hash of the card HTML, the background color, and a hash of the post screenshot.
2. Clone the card and remove screen-only elements, such as the share button and progress bars.
3. Replace the LinkedIn iframe. The browser cannot read pixels from a cross-origin iframe, so the clone shows the post screenshot or a trophy icon.
4. Add the clone to a hidden container on the page.
5. Replace gradient text with solid text, because html-to-image does not render `background-clip: text`.
6. Wait for images to load, then render the PNG.
7. Store the PNG in the cache and remove the container.

If you do not give a background color, the function reads the `--card-bg-color` custom property of the card.

`postImage` is a data URL from `getPostImage` in `postScreenshot.ts`. Only the Peak Performer card uses it. If it is null, the card shows the trophy icon.

## Cache: `imageCache.ts`

`imageCache` is a least recently used (LRU) cache. It holds at most 12 images and 15 MB. When it goes over a limit, it removes the least recently used entries first.

## Batch export: `batchImageExporter.ts`

`exportCardsAsImagesBatch(cards, { postImage? })` returns the PNG data URLs in the same order as the cards.

The function exports 8 cards at a time. If any card fails, the function throws one error with the failure count and the first error message.

## PDF export: `pdfExport.ts`

`buildCardsPDF(cards, { postImage? })` renders the cards with the batch exporter and returns the PDF as a `Blob`. It does not download the file. The caller saves or shares it.

Each page is 216 mm wide and has the same aspect ratio as the card, so the card fills the page with no margin. The function loads jsPDF only when the user exports a PDF.

## Examples

```typescript
import { exportCardAsImage } from '@exports/imageExport';
import { buildCardsPDF } from '@exports/pdfExport';
import { getPostImage } from '@exports/postScreenshot';

const postImage = await getPostImage(topPostUrl);

const dataUrl = await exportCardAsImage(cardElement, { postImage });

const pdf = await buildCardsPDF(cardElements, { postImage });
```

## Errors

Each export function throws an `Error` with a message that names the failed step:

- `Failed to export card as image: ...` for a single card.
- `Batch image export failed: ...` when one or more cards in a batch fail.
- `PDF export failed: ...` when the PDF step fails.
- `No cards provided for ...` when the card list is empty.

## Dependencies

- `html-to-image` renders the card to a PNG.
- `jspdf` builds the PDF.
- `hash-sum` makes the cache keys.
