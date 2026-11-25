import { describe, expect, it } from 'vitest';
import { generateLinkedInShareUrl } from './linkedinShareLink';

const textOf = (url: string) => new URL(url).searchParams.get('text');

describe('generateLinkedInShareUrl', () => {
  it('starts with the badge sentence when the user has a badge', () => {
    const url = generateLinkedInShareUrl({
      impressions: '1.2M',
      membersReached: '300K',
      year: 2026,
      topBadgeSentence: 'I hit a million impressions on LinkedIn this year. Did you?',
    });
    expect(url.startsWith('https://www.linkedin.com/feed/?shareActive=true&text=')).toBe(true);
    expect(textOf(url)).toBe(
      'I hit a million impressions on LinkedIn this year. Did you?\n\n' +
        'Get your Wrapped for LinkedIn 2026: https://wrappedforlinkedin.onrender.com/\n\n' +
        '#WrappedForLinkedIn #2026Recap #Render',
    );
  });

  it('keeps the stats text when the user has no badge', () => {
    const url = generateLinkedInShareUrl({ impressions: '50K', membersReached: '20K', year: 2026 });
    expect(textOf(url)).toBe(
      '🎁 Just got my Wrapped for LinkedIn 2026!\n\n' +
        'This year: 50K impressions, 20K people reached, and countless connections that mattered.\n\n' +
        "What's your LinkedIn story? Get yours here: https://wrappedforlinkedin.onrender.com/\n\n" +
        '#WrappedForLinkedIn #2026Recap #Render',
    );
  });
});
