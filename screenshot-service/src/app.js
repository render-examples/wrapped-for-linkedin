import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { isValidUrn } from './urn.js';
import { TtlCache } from './cache.js';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * @typedef {import('./linkedin.js').PostStatus} PostStatus
 * @typedef {{
 *   allowedOrigins: string[],
 *   checkStatus: (urn: string) => Promise<PostStatus>,
 *   takeScreenshot: (urn: string) => Promise<{ status: PostStatus, image?: Buffer }>,
 *   rateLimitPerMinute?: number,
 *   log?: (message: string) => void,
 * }} AppOptions
 */

/**
 * Share one pending promise per key, so parallel requests for the same URN do the work once.
 * @template T
 */
function dedupe() {
  /** @type {Map<string, Promise<T>>} */
  const pending = new Map();
  /**
   * @param {string} key
   * @param {() => Promise<T>} task
   */
  return (key, task) => {
    let promise = pending.get(key);
    if (!promise) {
      promise = task().finally(() => pending.delete(key));
      pending.set(key, promise);
    }
    return promise;
  };
}

/**
 * @param {AppOptions} options
 */
export function createApp({
  allowedOrigins,
  checkStatus,
  takeScreenshot,
  rateLimitPerMinute = 60,
  log = console.log,
}) {
  const app = express();
  app.disable('x-powered-by');
  // Render sends requests through one proxy. Use the client IP from X-Forwarded-For.
  app.set('trust proxy', 1);

  const statusCache = new TtlCache({ ttlMs: HOUR_MS, maxEntries: 10_000 });
  const imageCache = new TtlCache({ ttlMs: DAY_MS, maxEntries: 500 });
  const statusRequests = dedupe();
  const imageRequests = dedupe();

  // Log only the status code. Never log the URN, the IP address, or headers.
  app.use((req, res, next) => {
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
      windowMs: 60 * 1000,
      limit: rateLimitPerMinute,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    })
  );

  /**
   * Accept only a `urn` query parameter with a valid post URN.
   * @param {import('express').Request} req
   */
  const readUrn = (req) => {
    const keys = Object.keys(req.query);
    if (keys.length !== 1 || keys[0] !== 'urn') {
      return null;
    }
    return isValidUrn(req.query.urn) ? req.query.urn : null;
  };

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
      res.status(502).set('Cache-Control', 'no-store').end();
      return;
    }
    res
      .status(status === 'public' ? 200 : 404)
      .set('Cache-Control', 'public, max-age=3600')
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

    if (result.status === 'public' && result.image) {
      res
        .status(200)
        .type('png')
        .set('Cache-Control', 'public, max-age=86400, immutable')
        .send(result.image);
      return;
    }
    if (result.status === 'unavailable') {
      res.status(404).set('Cache-Control', 'public, max-age=3600').end();
      return;
    }
    res.status(502).set('Cache-Control', 'no-store').end();
  });

  app.use((_req, res) => {
    res.status(404).end();
  });

  return app;
}
