import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { classifyEmbedResponse, clipAboveActionBar } from '../src/linkedin.js';

describe('classifyEmbedResponse', () => {
  it('returns public for a 200 with a post card', () => {
    assert.equal(classifyEmbedResponse(200, '<article class="main-feed-activity-embed-card">'), 'public');
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
