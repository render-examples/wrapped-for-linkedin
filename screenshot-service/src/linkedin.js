import { chromium } from 'playwright';
import { embedUrlForUrn } from './urn.js';
import { createLimiter } from './limiter.js';

// LinkedIn's embed width.
const EMBED_WIDTH = 504;
const POST_SELECTOR = 'article.main-feed-activity-embed-card';
// The Like, Comment, and Share bar. The screenshot ends above it.
const ACTION_BAR_SELECTOR = '.social-action-bar';
const NAVIGATION_TIMEOUT_MS = 15_000;
const IMAGE_SETTLE_TIMEOUT_MS = 5_000;
const MAX_PAGES = 2;

/**
 * @typedef {'public' | 'unavailable' | 'error'} PostStatus
 */

/**
 * Classify a response from the LinkedIn embed page.
 * LinkedIn returns 404 and its error page for a private or deleted post.
 * @param {number} status
 * @param {string} html
 * @returns {PostStatus}
 */
export function classifyEmbedResponse(status, html) {
  if (status === 404 || html.includes('error-pages')) {
    return 'unavailable';
  }
  if (status === 200 && html.includes('main-feed-activity-embed-card')) {
    return 'public';
  }
  return 'error';
}

/**
 * Fetch the embed HTML without a browser and classify it.
 * @param {string} urn
 * @returns {Promise<PostStatus>}
 */
export async function fetchPostStatus(urn) {
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
 * @typedef {{ x: number, y: number, width: number, height: number }} Box
 */

/**
 * Get a clip from the top of the post to the top of the action bar.
 * @param {Box} post
 * @param {Box | null} actionBar
 * @returns {Box | null} Null if the action bar is not inside the post.
 */
export function clipAboveActionBar(post, actionBar) {
  if (!actionBar || actionBar.y <= post.y || actionBar.y >= post.y + post.height) {
    return null;
  }
  return { x: post.x, y: post.y, width: post.width, height: actionBar.y - post.y };
}

/** @type {Promise<import('playwright').Browser> | null} */
let browserPromise = null;

function getBrowser() {
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

const limit = createLimiter(MAX_PAGES);

/**
 * Take a screenshot of the post in the embed page.
 * @param {string} urn
 * @returns {Promise<{ status: 'public', image: Buffer } | { status: 'unavailable' | 'error' }>}
 */
export function takePostScreenshot(urn) {
  return limit(async () => {
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

export async function closeBrowser() {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    browserPromise = null;
    await browser?.close();
  }
}
