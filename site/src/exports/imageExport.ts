/**
 * Export story cards as PNG images with html-to-image.
 *
 * Each card is cloned into a fixed-size off-screen container, so the PNG is
 * 1080 × 1350 on every device. The clone gets the `story-card-export` class,
 * which the stylesheet uses for export-only layout.
 */

import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { toPng } from 'html-to-image';
import hashSum from 'hash-sum';
import { imageCache } from '@exports/imageCache';
import { Icon } from '@components/Icon';

export const EXPORT_WIDTH = 1080;
export const EXPORT_HEIGHT = 1350;

// The clone is laid out at this CSS size and scaled up to EXPORT_WIDTH × EXPORT_HEIGHT.
const EXPORT_CSS_WIDTH = 432;
const EXPORT_CSS_HEIGHT = (EXPORT_CSS_WIDTH * EXPORT_HEIGHT) / EXPORT_WIDTH;
const EXPORT_PIXEL_RATIO = EXPORT_WIDTH / EXPORT_CSS_WIDTH;
const EXPORT_ZINDEX = 999999;
const DEFAULT_BACKGROUND = '#0d0d0d';

// Elements that only make sense on screen.
const SCREEN_ONLY_SELECTORS = [
  '.share-button-wrapper',
  '.card-progress-wrapper',
  '.card-logo',
  '.post-status-link',
].join(', ');

export interface ExportCardOptions {
  backgroundColor?: string;
  useCache?: boolean;
  cardId?: string;
  // Data URL of the post screenshot for the Peak Performer card, or null to show the fallback.
  postImage?: string | null;
}

/**
 * Get the card background color from the `--card-bg-color` custom property.
 */
export function getCardBackgroundColor(element: HTMLElement): string {
  const value = getComputedStyle(element).getPropertyValue('--card-bg-color').trim();
  return value || DEFAULT_BACKGROUND;
}

// Render the trophy icon at once, so the clone has the SVG before the export reads it.
function createPostFallback(): HTMLElement {
  const fallback = document.createElement('div');
  fallback.className = 'peak-post-export-fallback';
  const icon = document.createElement('div');
  icon.className = 'peak-post-export-fallback-icon';
  const root = createRoot(icon);
  flushSync(() => root.render(createElement(Icon, { name: 'trophy' })));
  fallback.appendChild(icon);
  return fallback;
}

interface PostImage {
  src: string;
  width: number;
  height: number;
}

async function loadPostImage(src: string): Promise<PostImage | null> {
  const image = new Image();
  image.src = src;
  try {
    await image.decode();
  } catch {
    return null;
  }
  return { src, width: image.naturalWidth, height: image.naturalHeight };
}

// A background image, because html-to-image does not apply object-fit to <img> elements.
// The aspect ratio makes the box as tall as the image, so no empty area shows below the post.
function createPostImage({ src, width, height }: PostImage): HTMLElement {
  const image = document.createElement('div');
  image.className = 'peak-post-export-image';
  image.style.backgroundImage = `url("${src}")`;
  image.style.aspectRatio = `${width} / ${height}`;
  return image;
}

/**
 * Remove screen-only elements and replace the LinkedIn iframe.
 * The browser cannot read pixels from a cross-origin iframe, so the export
 * uses a server-side screenshot or a fallback emoji.
 */
function prepareCloneContent(clone: HTMLElement, postImage: PostImage | null): void {
  clone.querySelectorAll(SCREEN_ONLY_SELECTORS).forEach((el) => el.remove());

  clone
    .querySelectorAll('.peak-post-embed-container, .peak-post-unavailable')
    .forEach((el) => el.replaceWith(postImage ? createPostImage(postImage) : createPostFallback()));

  clone.classList.add('active', 'story-card-export');
}

/**
 * html-to-image does not render gradient text (`background-clip: text`)
 * correctly. Replace it with solid text in the element's own color.
 * Call this after the clone is in the DOM, so computed styles are available.
 */
function flattenGradientText(clone: HTMLElement): void {
  const elements = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  for (const el of elements) {
    const style = getComputedStyle(el);
    const clip = style.getPropertyValue('-webkit-background-clip') || style.backgroundClip;
    if (clip !== 'text') {
      continue;
    }
    el.style.setProperty('background', 'none', 'important');
    el.style.setProperty('-webkit-background-clip', 'border-box', 'important');
    el.style.setProperty('background-clip', 'border-box', 'important');
    el.style.setProperty('-webkit-text-fill-color', 'currentColor', 'important');
  }
}

function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll('img'));
  return Promise.all(
    images.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve();
            img.onerror = () => resolve();
          })
    )
  ).then(() => undefined);
}

/**
 * Export a single card as a 1080 × 1350 PNG.
 * @returns A data URL of the PNG.
 */
export async function exportCardAsImage(
  element: HTMLElement,
  options: ExportCardOptions = {}
): Promise<string> {
  const {
    backgroundColor = getCardBackgroundColor(element),
    useCache = true,
    cardId,
    postImage = null,
  } = options;

  try {
    const id = cardId || element.id || `card-${hashSum(element.innerHTML)}`;
    const usesPostImage = element.querySelector('.peak-post-embed-wrapper') !== null;
    const postKey = usesPostImage && postImage ? hashSum(postImage) : 'none';
    const cacheKey = `${id}-${backgroundColor.replace('#', '')}-${postKey}`;

    if (useCache) {
      const cached = imageCache.get(cacheKey);
      if (cached) {
        return cached.dataUrl;
      }
    }

    const loadedPostImage = usesPostImage && postImage ? await loadPostImage(postImage) : null;
    const clone = element.cloneNode(true) as HTMLElement;
    prepareCloneContent(clone, loadedPostImage);

    Object.assign(clone.style, {
      position: 'relative',
      inset: 'auto',
      width: `${EXPORT_CSS_WIDTH}px`,
      height: `${EXPORT_CSS_HEIGHT}px`,
      margin: '0',
      opacity: '1',
      transform: 'none',
      transition: 'none',
      visibility: 'visible',
      borderRadius: '0',
      overflow: 'hidden',
    });

    const container = document.createElement('div');
    Object.assign(container.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: `${EXPORT_CSS_WIDTH}px`,
      height: `${EXPORT_CSS_HEIGHT}px`,
      zIndex: String(EXPORT_ZINDEX),
      pointerEvents: 'none',
      opacity: '0',
    });

    container.appendChild(clone);
    document.body.appendChild(container);

    try {
      flattenGradientText(clone);
      await waitForImages(clone);

      const dataUrl = await toPng(clone, {
        cacheBust: true,
        pixelRatio: EXPORT_PIXEL_RATIO,
        width: EXPORT_CSS_WIDTH,
        height: EXPORT_CSS_HEIGHT,
        backgroundColor,
      });

      if (useCache) {
        imageCache.set(cacheKey, {
          dataUrl,
          timestamp: Date.now(),
          backgroundColor,
          size: dataUrl.length,
        });
      }

      return dataUrl;
    } finally {
      container.remove();
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to export card as image: ${errorMessage}`);
  }
}
