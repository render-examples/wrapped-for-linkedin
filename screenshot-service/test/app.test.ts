import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { Express } from 'express';
import { createApp, createDeduper, type AppOptions } from '../src/app.ts';
import { LimiterBusyError } from '../src/limiter.ts';
import type { PostStatus, ScreenshotResult } from '../src/linkedin.ts';

const ORIGIN = 'https://wrappedforlinkedin.onrender.com';
const PUBLIC_URN = 'urn:li:share:1';
const PRIVATE_URN = 'urn:li:share:2';
const BROKEN_URN = 'urn:li:share:3';
const OTHER_PUBLIC_URN = 'urn:li:share:4';
const PNG = Buffer.from([137, 80, 78, 71]);
const HOUR_MS = 60 * 60 * 1000;

const STATUS_BY_URN: Record<string, PostStatus> = {
  [PUBLIC_URN]: 'public',
  [OTHER_PUBLIC_URN]: 'public',
  [PRIVATE_URN]: 'unavailable',
};
const statusFor = (urn: string): PostStatus => STATUS_BY_URN[urn] ?? 'error';
const screenshotFor = (urn: string): ScreenshotResult => {
  const status = statusFor(urn);
  return status === 'public' ? { status, image: PNG } : { status };
};

/** Start the app on a free port. Reject if the port cannot be opened. */
function listen(app: Express): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => resolve(server));
    server.once('error', reject);
  });
}

function close(server: Server): Promise<void> {
  return new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

const servers: Server[] = [];
afterEach(async () => {
  await Promise.all(servers.splice(0).map(close));
});

/** Start a new app for one test. Count the calls to LinkedIn and keep the log lines. */
async function start(options: Partial<AppOptions> = {}) {
  const logs: string[] = [];
  const calls = { status: 0, screenshot: 0 };
  const server = await listen(
    createApp({
      allowedOrigins: [ORIGIN],
      log: (message) => logs.push(message),
      checkStatus: async (urn) => {
        calls.status++;
        return statusFor(urn);
      },
      takeScreenshot: async (urn) => {
        calls.screenshot++;
        return screenshotFor(urn);
      },
      ...options,
    })
  );
  servers.push(server);
  const { port } = server.address() as AddressInfo;
  const get = (path: string) => fetch(`http://127.0.0.1:${port}${path}`, { headers: { Origin: ORIGIN } });
  return { get, logs, calls };
}

describe('screenshot service', () => {
  it('returns 200 for a public post and 404 for a private post', async () => {
    const { get } = await start();
    assert.equal((await get(`/post-status?urn=${PUBLIC_URN}`)).status, 200);
    assert.equal((await get(`/post-status?urn=${PRIVATE_URN}`)).status, 404);
  });

  it('returns 502 when LinkedIn gives an unexpected response', async () => {
    const { get } = await start();
    assert.equal((await get(`/post-status?urn=${BROKEN_URN}`)).status, 502);
    assert.equal((await get(`/post-image?urn=${BROKEN_URN}`)).status, 502);
  });

  it('caches post status', async () => {
    const { get, calls } = await start();
    await get(`/post-status?urn=${PUBLIC_URN}`);
    await get(`/post-status?urn=${PUBLIC_URN}`);
    assert.equal(calls.status, 1);
  });

  it('returns a PNG with CORS and cache headers', async () => {
    const { get } = await start();
    const response = await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
    assert.match(response.headers.get('cache-control') ?? '', /max-age=86400/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), PNG);
  });

  it('caches images', async () => {
    const { get, calls } = await start();
    await get(`/post-image?urn=${PUBLIC_URN}`);
    await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(calls.screenshot, 1);
  });

  it('removes the oldest image when the image cache is over its size limit', async () => {
    const { get, calls } = await start({ imageCacheMaxBytes: PNG.length + 1 });
    await get(`/post-image?urn=${PUBLIC_URN}`);
    await get(`/post-image?urn=${OTHER_PUBLIC_URN}`);
    await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(calls.screenshot, 3);
  });

  it('returns 404 for the image of a private post', async () => {
    const { get } = await start();
    assert.equal((await get(`/post-image?urn=${PRIVATE_URN}`)).status, 404);
  });

  it('returns the cached 404 for an image without starting the browser', async () => {
    const { get, calls } = await start();
    await get(`/post-status?urn=${PRIVATE_URN}`);
    assert.equal((await get(`/post-image?urn=${PRIVATE_URN}`)).status, 404);
    assert.equal(calls.screenshot, 0);
  });

  it('keeps an unavailable image result only as long as the post status', async () => {
    let now = 0;
    let status: PostStatus = 'unavailable';
    const { get } = await start({
      now: () => now,
      takeScreenshot: async () => (status === 'public' ? { status, image: PNG } : { status: 'unavailable' }),
    });
    assert.equal((await get(`/post-image?urn=${PUBLIC_URN}`)).status, 404);
    status = 'public';
    now = HOUR_MS + 1;
    assert.equal((await get(`/post-image?urn=${PUBLIC_URN}`)).status, 200);
  });

  it('rejects a full URL, extra parameters, and a missing URN', async () => {
    const { get } = await start();
    const rejected = [
      '/post-image?urn=https://evil.example.com',
      '/post-image?url=https://www.linkedin.com',
      `/post-image?urn=${PUBLIC_URN}&impressions=100`,
      `/post-status?urn=${PUBLIC_URN}&urn=${PRIVATE_URN}`,
      '/post-status',
    ];
    for (const path of rejected) {
      assert.equal((await get(path)).status, 400, path);
    }
  });

  it('does not send CORS headers to other origins', async () => {
    const { get } = await start({ allowedOrigins: [] });
    const response = await get(`/post-status?urn=${PUBLIC_URN}`);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });

  it('logs only status codes', async () => {
    const { get, logs } = await start();
    await get(`/post-status?urn=${PUBLIC_URN}`);
    await get(`/post-image?urn=${PRIVATE_URN}`);
    await get('/post-status');
    await get('/missing');
    assert.deepEqual(logs, ['200', '404', '400', '404']);
  });

  it('returns 503 and caches nothing when too many screenshots wait', async () => {
    let busy = true;
    const { get } = await start({
      takeScreenshot: async () => {
        if (busy) {
          throw new LimiterBusyError();
        }
        return { status: 'public', image: PNG };
      },
    });
    const response = await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    busy = false;
    assert.equal((await get(`/post-image?urn=${PUBLIC_URN}`)).status, 200);
  });

  it('returns 503 and caches nothing when too many status checks wait', async () => {
    let busy = true;
    const { get } = await start({
      checkStatus: async () => {
        if (busy) {
          throw new LimiterBusyError();
        }
        return 'public';
      },
    });
    const response = await get(`/post-status?urn=${PUBLIC_URN}`);
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    busy = false;
    assert.equal((await get(`/post-status?urn=${PUBLIC_URN}`)).status, 200);
  });

  it('returns 500 for an unexpected error and logs only the status code', async (t) => {
    const consoleError = t.mock.method(console, 'error', () => {});
    const { get, logs } = await start({
      takeScreenshot: async () => {
        throw new Error(`failed for ${PUBLIC_URN}`);
      },
    });
    const response = await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(response.status, 500);
    assert.equal(await response.text(), '');
    assert.deepEqual(logs, ['500']);
    assert.equal(consoleError.mock.callCount(), 0);
  });
});

describe('rate limit', () => {
  it('returns 429 after the limit', async () => {
    const { get } = await start({ rateLimitPerMinute: 2 });
    const path = `/post-status?urn=${PUBLIC_URN}`;
    assert.equal((await get(path)).status, 200);
    assert.equal((await get(path)).status, 200);
    assert.equal((await get(path)).status, 429);
  });

  it('has a lower limit for images', async () => {
    const { get } = await start({ imageRateLimitPerMinute: 1 });
    assert.equal((await get(`/post-image?urn=${PUBLIC_URN}`)).status, 200);
    assert.equal((await get(`/post-image?urn=${PUBLIC_URN}`)).status, 429);
    assert.equal((await get(`/post-status?urn=${PUBLIC_URN}`)).status, 200);
  });
});

describe('createDeduper', () => {
  it('runs one task for parallel calls with the same key', async () => {
    const dedupe = createDeduper<number>();
    let runs = 0;
    const task = async () => {
      runs++;
      return runs;
    };
    const results = await Promise.all([dedupe('a', task), dedupe('a', task), dedupe('b', task)]);
    assert.deepEqual(results, [1, 1, 2]);
    assert.equal(runs, 2);
  });

  it('runs the task again after the first call ends', async () => {
    const dedupe = createDeduper<string>();
    let runs = 0;
    await dedupe('a', async () => String(++runs));
    await dedupe('a', async () => String(++runs));
    assert.equal(runs, 2);
  });

  it('runs the task again after a failure', async () => {
    const dedupe = createDeduper<string>();
    await assert.rejects(dedupe('a', async () => Promise.reject(new Error('fail'))));
    assert.equal(await dedupe('a', async () => 'ok'), 'ok');
  });
});
