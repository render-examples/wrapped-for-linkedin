import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyEmbedResponse,
  clipAboveActionBar,
  fetchPostStatus,
  isAllowedRequestUrl,
  takePostScreenshot,
} from '../src/linkedin.ts';

const URN = 'urn:li:share:1';
const POST_HTML = '<article class="main-feed-activity-embed-card">';

describe('classifyEmbedResponse', () => {
  it('returns public for a 200 with a post card', () => {
    assert.equal(classifyEmbedResponse(200, POST_HTML), 'public');
  });

  it('returns unavailable for a 404', () => {
    assert.equal(classifyEmbedResponse(404, '<html></html>'), 'unavailable');
  });

  it('returns unavailable for the LinkedIn error page', () => {
    assert.equal(classifyEmbedResponse(200, '<div class="error-pages">'), 'unavailable');
  });

  it('returns error for other responses', () => {
    assert.equal(classifyEmbedResponse(999, ''), 'error');
    assert.equal(classifyEmbedResponse(200, '<html>login</html>'), 'error');
    assert.equal(classifyEmbedResponse(500, ''), 'error');
  });
});

describe('clipAboveActionBar', () => {
  const post = { x: 2, y: 10, width: 500, height: 800 };

  it('ends the clip at the top of the action bar', () => {
    assert.deepEqual(clipAboveActionBar(post, { x: 2, y: 765, width: 500, height: 45 }), {
      x: 2,
      y: 10,
      width: 500,
      height: 755,
    });
  });

  it('returns null when there is no action bar', () => {
    assert.equal(clipAboveActionBar(post, null), null);
  });

  it('returns null when the action bar is not inside the post', () => {
    assert.equal(clipAboveActionBar(post, { x: 2, y: 5, width: 500, height: 45 }), null);
    assert.equal(clipAboveActionBar(post, { x: 2, y: 900, width: 500, height: 45 }), null);
  });
});

describe('fetchPostStatus', () => {
  it('does not follow redirects', async () => {
    let redirect: RequestInit['redirect'];
    const status = await fetchPostStatus(URN, async (_url, init) => {
      redirect = init?.redirect;
      return new Response(null, { status: 302, headers: { Location: 'https://evil.example.com' } });
    });
    assert.equal(redirect, 'manual');
    assert.equal(status, 'error');
  });

  it('reads a normal embed page', async () => {
    const status = await fetchPostStatus(URN, async () => new Response(POST_HTML));
    assert.equal(status, 'public');
  });

  it('returns error for a body over the size limit', async () => {
    const html = POST_HTML + 'x'.repeat(2 * 1024 * 1024);
    const status = await fetchPostStatus(URN, async () => new Response(html));
    assert.equal(status, 'error');
  });
});

describe('isAllowedRequestUrl', () => {
  it('allows LinkedIn and licdn.com hosts over HTTPS', () => {
    const allowed = [
      'https://www.linkedin.com/embed/feed/update/urn:li:share:1',
      'https://linkedin.com/',
      'https://static.licdn.com/aero-v1/sc/h/abc.css',
      'https://media.licdn.com/dms/image/abc',
      'data:image/png;base64,AAAA',
    ];
    for (const url of allowed) {
      assert.equal(isAllowedRequestUrl(url), true, url);
    }
  });

  it('blocks other hosts and schemes', () => {
    const blocked = [
      'https://evil.example.com/',
      'https://linkedin.com.evil.example.com/',
      'https://evillinkedin.com/',
      'http://www.linkedin.com/',
      'http://169.254.169.254/latest/meta-data/',
      'file:///etc/passwd',
      'not a url',
    ];
    for (const url of blocked) {
      assert.equal(isAllowedRequestUrl(url), false, url);
    }
  });
});

describe('takePostScreenshot', () => {
  it('returns error when the browser does not start', async () => {
    const result = await takePostScreenshot(URN, () => Promise.reject(new Error('launch failed')));
    assert.deepEqual(result, { status: 'error' });
  });
});
