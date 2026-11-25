import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { embedUrlForUrn } from './urn.ts';
import { createLimiter } from './limiter.ts';

// LinkedIn's embed width.
const EMBED_WIDTH = 504;
const VIEWPORT_HEIGHT = 1200;
// Take the screenshot at 2x so the image stays sharp on the exported card.
const DEVICE_SCALE_FACTOR = 2;
const POST_CLASS = 'main-feed-activity-embed-card';
const POST_SELECTOR = `article.${POST_CLASS}`;
// The Like, Comment, and Share bar. The screenshot ends above it.
const ACTION_BAR_SELECTOR = '.social-action-bar';
const NAVIGATION_TIMEOUT_MS = 15_000;
const IMAGE_SETTLE_TIMEOUT_MS = 5_000;
const ACTION_BAR_TIMEOUT_MS = 1_000;
const MAX_CONCURRENT_PAGES = 2;
// Screenshot requests that wait for a page. More requests get a 503.
const MAX_QUEUED_PAGES = 8;
const QUEUE_TIMEOUT_MS = 20_000;
// An embed page is about 25 KB.
const MAX_EMBED_HTML_BYTES = 1024 * 1024;
// The embed page loads only from these hosts and their subdomains.
const ALLOWED_HOSTS = ['linkedin.com', 'licdn.com'];

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
  if (status === 200 && html.includes(POST_CLASS)) {
    return 'public';
  }
  return 'error';
}

/** Read the body as text. Returns null if it is larger than `maxBytes`. */
async function readTextWithLimit(response: Response, maxBytes: number): Promise<string | null> {
  if (!response.body) {
    return '';
  }
  const chunks: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of response.body) {
    size += chunk.byteLength;
    if (size > maxBytes) {
      await response.body.cancel().catch(() => {});
      return null;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

/**
 * Fetch the embed HTML without a browser and classify it.
 * A redirect is an error, so the request cannot leave LinkedIn.
 */
export async function fetchPostStatus(urn: string, fetchFn: typeof fetch = fetch): Promise<PostStatus> {
  try {
    const response = await fetchFn(embedUrlForUrn(urn), {
      redirect: 'manual',
      signal: AbortSignal.timeout(NAVIGATION_TIMEOUT_MS),
    });
    const html = await readTextWithLimit(response, MAX_EMBED_HTML_BYTES);
    return html === null ? 'error' : classifyEmbedResponse(response.status, html);
  } catch {
    return 'error';
  }
}

/** Allow only HTTPS requests to LinkedIn hosts, and inline data: URLs. */
export function isAllowedRequestUrl(url: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol === 'data:') {
    return true;
  }
  if (parsed.protocol !== 'https:') {
    return false;
  }
  return ALLOWED_HOSTS.some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
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

/** Open the embed page for the URN and take a screenshot of the post. */
async function capturePost(page: Page, urn: string): Promise<ScreenshotResult> {
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
  await page
    .waitForLoadState('networkidle', { timeout: IMAGE_SETTLE_TIMEOUT_MS })
    .catch(() => {});

  const postBox = await post.boundingBox();
  const actionBarBox = await post
    .locator(ACTION_BAR_SELECTOR)
    .first()
    .boundingBox({ timeout: ACTION_BAR_TIMEOUT_MS })
    .catch(() => null);
  const clip = postBox && clipAboveActionBar(postBox, actionBarBox);
  const image = clip
    ? await page.screenshot({ type: 'png', clip, fullPage: true })
    : await post.screenshot({ type: 'png' });
  return { status: 'public', image };
}

const runWithPageLimit = createLimiter({
  limit: MAX_CONCURRENT_PAGES,
  maxQueue: MAX_QUEUED_PAGES,
  queueTimeoutMs: QUEUE_TIMEOUT_MS,
});

/**
 * Take a screenshot of the post in a new browser context.
 * Rejects with LimiterBusyError when too many screenshots wait for a page.
 * `launch` is for tests.
 */
export function takePostScreenshot(
  urn: string,
  launch: () => Promise<Browser> = getBrowser
): Promise<ScreenshotResult> {
  return runWithPageLimit(async () => {
    let context: BrowserContext | undefined;
    try {
      const browser = await launch();
      context = await browser.newContext({
        viewport: { width: EMBED_WIDTH, height: VIEWPORT_HEIGHT },
        deviceScaleFactor: DEVICE_SCALE_FACTOR,
      });
      await context.route('**/*', (route) =>
        isAllowedRequestUrl(route.request().url()) ? route.continue() : route.abort()
      );
      return await capturePost(await context.newPage(), urn);
    } catch {
      return { status: 'error' };
    } finally {
      await context?.close().catch(() => {});
    }
  });
}

/** Close the shared browser, if it is open. */
export async function closeBrowser(): Promise<void> {
  if (browserPromise) {
    const browser = await browserPromise.catch(() => null);
    browserPromise = null;
    await browser?.close();
  }
}
