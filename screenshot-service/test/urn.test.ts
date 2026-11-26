import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { embedUrlForUrn, isValidUrn } from '../src/urn.ts';

describe('isValidUrn', () => {
  it('accepts activity, share, and ugcPost URNs', () => {
    assert.equal(isValidUrn('urn:li:activity:7273484794833833984'), true);
    assert.equal(isValidUrn('urn:li:share:7485528159346622464'), true);
    assert.equal(isValidUrn('urn:li:ugcPost:7385845292233048064'), true);
    assert.equal(isValidUrn(`urn:li:share:${'1'.repeat(20)}`), true);
  });

  it('rejects full URLs and other values', () => {
    const invalid: unknown[] = [
      'https://www.linkedin.com/embed/feed/update/urn:li:share:123',
      'https://evil.example.com',
      'urn:li:share:',
      'urn:li:share:12a',
      'urn:li:comment:123',
      'urn:li:share:123/../../evil',
      'urn:li:share:123\n',
      `urn:li:share:${'1'.repeat(21)}`,
      ' urn:li:share:123',
      '',
      undefined,
      ['urn:li:share:123'],
    ];
    for (const value of invalid) {
      assert.equal(isValidUrn(value), false, `expected ${JSON.stringify(value)} to be rejected`);
    }
  });
});

describe('embedUrlForUrn', () => {
  it('builds the LinkedIn embed URL', () => {
    assert.equal(
      embedUrlForUrn('urn:li:share:123'),
      'https://www.linkedin.com/embed/feed/update/urn:li:share:123'
    );
  });
});
