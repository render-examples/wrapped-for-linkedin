import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import type { Express } from 'express';
import { createApp } from '../src/app.ts';
import type { PostStatus } from '../src/linkedin.ts';

const ORIGIN = 'https://wrappedforlinkedin.onrender.com';
const PUBLIC_URN = 'urn:li:share:1';
const PRIVATE_URN = 'urn:li:share:2';
const BROKEN_URN = 'urn:li:share:3';
const PNG = Buffer.from([137, 80, 78, 71]);

const STATUS_BY_URN: Record<string, PostStatus> = {
  [PUBLIC_URN]: 'public',
  [PRIVATE_URN]: 'unavailable',
};
const statusFor = (urn: string): PostStatus => STATUS_BY_URN[urn] ?? 'error';

/** Start the app on a free port. */
function listen(app: Express): Promise<{ server: Server; baseUrl: string }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      resolve({ server, baseUrl: `http://127.0.0.1:${port}` });
    });
  });
}

describe('screenshot service', () => {
  let server: Server;
  let baseUrl: string;
  const logs: string[] = [];
  const calls = { status: 0, screenshot: 0 };

  before(async () => {
    const app = createApp({
      allowedOrigins: [ORIGIN],
      log: (message) => logs.push(message),
      checkStatus: async (urn) => {
        calls.status++;
        return statusFor(urn);
      },
      takeScreenshot: async (urn) => {
        calls.screenshot++;
        const status = statusFor(urn);
        return status === 'public' ? { status, image: PNG } : { status };
      },
    });
    ({ server, baseUrl } = await listen(app));
  });

  after(() => server.close());

  const get = (path: string) => fetch(`${baseUrl}${path}`, { headers: { Origin: ORIGIN } });

  it('returns 200 for a public post and 404 for a private post', async () => {
    assert.equal((await get(`/post-status?urn=${PUBLIC_URN}`)).status, 200);
    assert.equal((await get(`/post-status?urn=${PRIVATE_URN}`)).status, 404);
  });

  it('returns 502 when LinkedIn gives an unexpected response', async () => {
    assert.equal((await get(`/post-status?urn=${BROKEN_URN}`)).status, 502);
    assert.equal((await get(`/post-image?urn=${BROKEN_URN}`)).status, 502);
  });

  it('caches post status', async () => {
    const callsBefore = calls.status;
    await get(`/post-status?urn=${PUBLIC_URN}`);
    await get(`/post-status?urn=${PUBLIC_URN}`);
    assert.equal(calls.status, callsBefore);
  });

  it('returns a PNG with CORS and cache headers', async () => {
    const response = await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(response.headers.get('access-control-allow-origin'), ORIGIN);
    assert.match(response.headers.get('cache-control') ?? '', /max-age=86400/);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), PNG);
  });

  it('caches images', async () => {
    const callsBefore = calls.screenshot;
    await get(`/post-image?urn=${PUBLIC_URN}`);
    assert.equal(calls.screenshot, callsBefore);
  });

  it('returns 404 for the image of a private post', async () => {
    assert.equal((await get(`/post-image?urn=${PRIVATE_URN}`)).status, 404);
  });

  it('rejects a full URL, extra parameters, and a missing URN', async () => {
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
    const response = await fetch(`${baseUrl}/post-status?urn=${PUBLIC_URN}`, {
      headers: { Origin: 'https://evil.example.com' },
    });
    assert.equal(response.headers.get('access-control-allow-origin'), null);
  });

  it('logs only status codes', () => {
    assert.ok(logs.length > 0);
    for (const line of logs) {
      assert.match(line, /^\d{3}$/);
    }
  });
});

describe('rate limit', () => {
  it('returns 429 after the limit', async () => {
    const app = createApp({
      allowedOrigins: [],
      log: () => {},
      rateLimitPerMinute: 2,
      checkStatus: async () => 'public',
      takeScreenshot: async () => ({ status: 'public', image: PNG }),
    });
    const { server, baseUrl } = await listen(app);
    const url = `${baseUrl}/post-status?urn=${PUBLIC_URN}`;
    try {
      assert.equal((await fetch(url)).status, 200);
      assert.equal((await fetch(url)).status, 200);
      assert.equal((await fetch(url)).status, 429);
    } finally {
      server.close();
    }
  });
});
