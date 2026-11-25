import express, { type Request } from 'express';
import { rateLimit } from 'express-rate-limit';
import { isValidUrn } from './urn.ts';
import { TtlCache } from './cache.ts';
import type { PostStatus, ScreenshotResult } from './linkedin.ts';

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const NO_STORE = 'no-store';
const CACHE_ONE_HOUR = 'public, max-age=3600';
const CACHE_ONE_DAY = 'public, max-age=86400, immutable';

export type AppOptions = {
  allowedOrigins: string[];
  checkStatus: (urn: string) => Promise<PostStatus>;
  takeScreenshot: (urn: string) => Promise<ScreenshotResult>;
  rateLimitPerMinute?: number;
  log?: (message: string) => void;
};

/**
 * Share one pending promise per key, so parallel requests for the same URN do the work once.
 */
function dedupe<T>() {
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

export function createApp({
  allowedOrigins,
  checkStatus,
  takeScreenshot,
  rateLimitPerMinute = 60,
  log = console.log,
}: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  // Render sends requests through one proxy. Use the client IP from X-Forwarded-For.
  app.set('trust proxy', 1);

  const statusCache = new TtlCache<PostStatus>({ ttlMs: HOUR_MS, maxEntries: 10_000 });
  const imageCache = new TtlCache<ScreenshotResult>({ ttlMs: DAY_MS, maxEntries: 500 });
  const statusRequests = dedupe<PostStatus>();
  const imageRequests = dedupe<ScreenshotResult>();

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

  app.use(
    rateLimit({
      windowMs: MINUTE_MS,
      limit: rateLimitPerMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    })
  );

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

    if (status === 'error') {
      res.status(502).set('Cache-Control', NO_STORE).end();
      return;
    }
    res
      .status(status === 'public' ? 200 : 404)
      .set('Cache-Control', CACHE_ONE_HOUR)
      .end();
  });

  app.get('/post-image', async (req, res) => {
    const urn = readUrn(req);
    if (!urn) {
      res.status(400).end();
      return;
    }

    let result = imageCache.get(urn);
    if (!result) {
      result = await imageRequests(urn, () => takeScreenshot(urn));
      if (result.status !== 'error') {
        imageCache.set(urn, result);
        statusCache.set(urn, result.status);
      }
    }

    if (result.status === 'public') {
      res
        .status(200)
        .type('png')
        .set('Cache-Control', CACHE_ONE_DAY)
        .send(result.image);
      return;
    }
    if (result.status === 'unavailable') {
      res.status(404).set('Cache-Control', CACHE_ONE_HOUR).end();
      return;
    }
    res.status(502).set('Cache-Control', NO_STORE).end();
  });

  app.use((_req, res) => {
    res.status(404).end();
  });

  return app;
}
