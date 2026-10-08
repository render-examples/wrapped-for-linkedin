import { describe, expect, it } from 'vitest';
import { getLinkedInEmbedUrl } from './linkedinEmbed';

const EMBED = 'https://www.linkedin.com/embed/feed/update/';

describe('getLinkedInEmbedUrl', () => {
  it('uses the URN from an old feed/update URL', () => {
    expect(
      getLinkedInEmbedUrl('https://www.linkedin.com/feed/update/urn:li:activity:7273484794833833984')
    ).toBe(`${EMBED}urn:li:activity:7273484794833833984`);
  });

  it('builds a share URN from a new posts URL', () => {
    expect(
      getLinkedInEmbedUrl(
        'https://www.linkedin.com/posts/shifra-williams_agenticai-hackathon-share-7485528159346622464-sQj-'
      )
    ).toBe(`${EMBED}urn:li:share:7485528159346622464`);
  });

  it('builds a ugcPost URN from a new posts URL', () => {
    expect(
      getLinkedInEmbedUrl(
        'https://www.linkedin.com/posts/shifra-williams_github-brand-ugcPost-7385845292233048064-2nxT'
      )
    ).toBe(`${EMBED}urn:li:ugcPost:7385845292233048064`);
  });

  it('handles a suffix that starts with a hyphen', () => {
    expect(
      getLinkedInEmbedUrl('https://www.linkedin.com/posts/someone_topic-ugcPost-7385845292233048064--1fx')
    ).toBe(`${EMBED}urn:li:ugcPost:7385845292233048064`);
  });

  it('handles percent-encoded Unicode in the slug', () => {
    expect(
      getLinkedInEmbedUrl(
        'https://www.linkedin.com/posts/someone_caf%C3%A9-%F0%9F%8E%89-activity-7485528159346622464-AbCd'
      )
    ).toBe(`${EMBED}urn:li:activity:7485528159346622464`);
  });

  it('ignores a query string and a trailing slash', () => {
    expect(
      getLinkedInEmbedUrl(
        'https://www.linkedin.com/posts/someone_topic-share-7485528159346622464-sQj-/?utm_source=share'
      )
    ).toBe(`${EMBED}urn:li:share:7485528159346622464`);
    expect(
      getLinkedInEmbedUrl('https://www.linkedin.com/feed/update/urn:li:activity:7273484794833833984/')
    ).toBe(`${EMBED}urn:li:activity:7273484794833833984`);
  });

  it('keeps an encoded question mark in the slug', () => {
    expect(
      getLinkedInEmbedUrl('https://www.linkedin.com/posts/someone_why-not%3F-share-7485528159346622464-sQj-')
    ).toBe(`${EMBED}urn:li:share:7485528159346622464`);
  });

  it('returns null when the URL has no post ID', () => {
    expect(getLinkedInEmbedUrl('https://www.linkedin.com/in/shifra-williams')).toBeNull();
    expect(getLinkedInEmbedUrl('')).toBeNull();
  });
});
