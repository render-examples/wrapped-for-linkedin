import { chromium, type Browser } from 'playwright';
import { embedUrlForUrn } from './urn.ts';
import { createLimiter } from './limiter.ts';

// LinkedIn's embed width.
const EMBED_WIDTH = 504;
const POST_SELECTOR = 'article.main-feed-activity-embed-card';
// The Like, Comment, and Share bar. The screenshot ends above it.
const ACTION_BAR_SELECTOR = '.social-action-bar';
const NAVIGATION_TIMEOUT_MS = 15_000;
const IMAGE_SETTLE_TIMEOUT_MS = 5_000;
const MAX_CONCURRENT_PAGES = 2;

export type PostStatus = 'public' | 'unavailable' | 'error';

export type ScreenshotResult =
  | { status: 'public'; image: Buffer }
  | { status: 'unavailable' | 'error' };

type Box = { x: number; y: number; width: number; height: number };

/**
 * Classify a response from the LinkedIn embed page.
 * LinkedIn returns 404 and its error page for a private or deleted post.
 */
export function classifyEmbedResponse(status: number, html: string): PostStatus {
  if (status === 404 || html.includes('error-pages')) {
    return 'unavailable';
  }
  if (status === 200 && html.includes('main-feed-activity-embed-card')) {
    return 'public';
  }
  return 'error';
}

/** Fetch the embed HTML without a browser and classify it. */
export async function fetchPostStatus(urn: string): Promise<PostStatus> {
  try {
    const response = await fetch(embedUrlForUrn(urn), {
      redirect: 'follow',
      signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS),
    });
    return classifyEmbedResponse(response.status, await response.text());
  } catch {
    return 'error';
  }
}

/**
 * Get a clip from the top of the post to the top of the action bar.
 * Returns null if the action bar is not inside the post.
 */
export function clipAboveActionBar(post: Box, actionBar: Box | null): Box | null {
  if (!actionBar || actionBar.y <= post.y || actionBar.y >= post.y + post.height) {
    return null;
  }
  return { x: post.x, y: post.y, width: post.width, height: actionBar.y - post.y };
}

let browserPromise: Promise<Browser> | null = null;

function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ args: ['--disable-dev-shm-usage'] }).then((browser) => {
      browser.on('disconnected', () => {
        browserPromise = null;
      });
      return browser;
    });
    browserPromise.catch(() => {
      browserPromise = null;
    });
  }
  return browserPromise;
}

const limit = createLimiter(MAX_CONCURRENT_PAGES);

/** Take a screenshot of the post in the embed page. */
export function takePostScreenshot(urn: string): Promise<ScreenshotResult> {
  return limit(async (): Promise<ScreenshotResult> => {
    const browser = await getBrowser();
    const context = await browser.newContext({
      viewport: { width: EMBED_WIDTH, height: 1200 },
      deviceScaleFactor: 2,
    });
    try {
      const page = await context.newPage();
      const response = await page.goto(embedUrlForUrn(urn), {
        waitUntil: 'load',
        timeout: NAVIGATION_TIMEOUT_MS,
      });
      if (!response) {
        return { status: 'error' };
      }
      const status = classifyEmbedResponse(response.status(), await page.content());
      if (status !== 'public') {
        return { status };
      }
      const post = page.locator(POST_SELECTOR).first();
      await post.waitFor({ state: 'visible', timeout: NAVIGATION_TIMEOUT_MS });
      // LinkedIn loads profile and post images after the load event.
      await page.waitForLoadState('networkidle', { timeout: IMAGE_SETTLE_TIMEOUT_MS }).catch(() => {});
      const postBox = await post.boundingBox();
      const actionBarBox = await post
        .locator(ACTION_BAR_SELECTOR)
        .first()
        .boundingBox({ timeout: 1_000 })
        .catch(() => null);
      const clip = postBox && clipAboveActionBar(postBox, actionBarBox);
      const image = clip
        ? await page.screenshot({ type: 'png', clip, fullPage: true })
        : await post.screenshot({ type: 'png' });
      return { status: 'public', image };
    } catch {
      return { status: 'error' };
    } finally {
      await context.close().catch(() => {});
    }
  });
}

export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    browserPromise = null;
    await browser?.close();
  }
}
