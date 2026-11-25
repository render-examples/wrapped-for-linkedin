import express, { type NextFunction, type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { isValidUrn } from './urn.ts';
import { TtlCache } from './cache.ts';
import { LimiterBusyError } from './limiter.ts';
import type { PostStatus, ScreenshotResult } from './linkedin.ts';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const NO_STORE = 'no-store';
const CACHE_ONE_HOUR = 'public, max-age=3600';
const CACHE_ONE_DAY = 'public, max-age=86400, immutable';

// A 2x screenshot is often 0.5 to 1 MB.
const IMAGE_CACHE_MAX_BYTES = 100 * 1024 * 1024;

export type AppOptions = {
  allowedOrigins: string[];
  checkStatus: (urn: string) => Promise<PostStatus>;
  takeScreenshot: (urn: string) => Promise<ScreenshotResult>;
  rateLimitPerMinute?: number;
  // Each new image starts Chromium, so /post-image has a lower limit.
  imageRateLimitPerMinute?: number;
  imageCacheMaxBytes?: number;
  log?: (message: string) => void;
  // For tests.
  now?: () => number;
};

/**
 * Share one pending promise per key, so parallel requests for the same URN do the work once.
 */
export function createDeduper<T>() {
  const pending = new Map<string, Promise<T>>();
  return (key: string, task: () => Promise<T>): Promise<T> => {
    let promise = pending.get(key);
    if (!promise) {
      promise = task().finally(() => pending.delete(key));
      pending.set(key, promise);
    }
    return promise;
  };
}

/** Accept only a `urn` query parameter with a valid post URN. */
function readUrn(req: Request): string | null {
  const keys = Object.keys(req.query);
  if (keys.length !== 1 || keys[0] !== 'urn') {
    return null;
  }
  return isValidUrn(req.query.urn) ? req.query.urn : null;
}

/** Send 404 for a private or deleted post, and 502 for an unexpected LinkedIn response. */
function sendNotPublic(res: Response, status: Exclude<PostStatus, 'public'>): void {
  if (status === 'unavailable') {
    res.status(404).set('Cache-Control', CACHE_ONE_HOUR).end();
    return;
  }
  res.status(502).set('Cache-Control', NO_STORE).end();
}

export function createApp({
  allowedOrigins,
  checkStatus,
  takeScreenshot,
  rateLimitPerMinute = 60,
  imageRateLimitPerMinute = 20,
  imageCacheMaxBytes = IMAGE_CACHE_MAX_BYTES,
  log = console.log,
  now = Date.now,
}: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  // Render sends requests through one proxy. Use the client IP from X-Forwarded-For.
  app.set('trust proxy', 1);

  const statusCache = new TtlCache<PostStatus>({ ttlMs: HOUR_MS, maxEntries: 10_000, now });
  // Holds only images of public posts. statusCache holds the other results.
  const imageCache = new TtlCache<Buffer>({
    ttlMs: DAY_MS,
    maxEntries: 500,
    maxSize: imageCacheMaxBytes,
    sizeOf: (image) => image.length,
    now,
  });
  const statusRequests = createDeduper<PostStatus>();
  const imageRequests = createDeduper<ScreenshotResult>();

  // Log only the status code. Never log the URN, the IP address, or headers.
  app.use((_req, res, next) => {
    res.on('finish', () => log(String(res.statusCode)));
    next();
  });

  app.get('/healthz', (_req, res) => {
    res.status(200).send('ok');
  });

  app.use((req, res, next) => {
    const origin = req.get('origin');
    if (origin && allowedOrigins.includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Vary', 'Origin');
    next();
  });

  const limitPerMinute = (limit: number) =>
    rateLimit({
      windowMs: MINUTE_MS,
      limit,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    });
  app.use(limitPerMinute(rateLimitPerMinute));

  app.get('/post-status', async (req, res) => {
    const urn = readUrn(req);
    if (!urn) {
      res.status(400).end();
      return;
    }

    let status = statusCache.get(urn);
    if (!status) {
      status = await statusRequests(urn, () => checkStatus(urn));
      if (status !== 'error') {
        statusCache.set(urn, status);
      }
    }

    if (status === 'public') {
      res.status(200).set('Cache-Control', CACHE_ONE_HOUR).end();
      return;
    }
    sendNotPublic(res, status);
  });

  app.get('/post-image', limitPerMinute(imageRateLimitPerMinute), async (req, res) => {
    const urn = readUrn(req);
    if (!urn) {
      res.status(400).end();
      return;
    }

    const knownStatus = statusCache.get(urn);
    if (knownStatus && knownStatus !== 'public') {
      sendNotPublic(res, knownStatus);
      return;
    }

    let image = imageCache.get(urn);
    if (!image) {
      const result = await imageRequests(urn, () => takeScreenshot(urn));
      if (result.status !== 'error') {
        statusCache.set(urn, result.status);
      }
      if (result.status !== 'public') {
        sendNotPublic(res, result.status);
        return;
      }
      image = result.image;
      imageCache.set(urn, image);
    }

    res.status(200).type('png').set('Cache-Control', CACHE_ONE_DAY).send(image);
  });

  app.use((_req, res) => {
    res.status(404).end();
  });

  // Send 503 when too many screenshots wait, and 500 for other errors.
  // Do not log the error. It can contain the URN.
  app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) {
      res.end();
      return;
    }
    const status = error instanceof LimiterBusyError ? 503 : 500;
    res.status(status).set('Cache-Control', NO_STORE).end();
  });

  return app;
}
