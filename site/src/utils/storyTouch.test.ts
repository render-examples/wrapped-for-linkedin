import { describe, expect, it } from 'vitest';
import { isCardNavigationTouch } from './storyTouch';

const viewport = (containsTarget: boolean) => ({ contains: () => containsTarget }) as unknown as Element;
// A fake element. closest() finds a match when the element is one of the given tags or roles.
const element = (matches: string[]) =>
  ({
    closest: (selector: string) =>
      selector.split(',').some((part) => matches.includes(part.trim())) ? {} : null,
  }) as unknown as Element;

describe('isCardNavigationTouch', () => {
  it('accepts touches on card content', () => {
    expect(isCardNavigationTouch(element([]), viewport(true))).toBe(true);
  });

  it('ignores touches on buttons', () => {
    expect(isCardNavigationTouch(element(['button']), viewport(true))).toBe(false);
  });

  it('ignores touches on progress bars', () => {
    expect(isCardNavigationTouch(element(['[role="button"]']), viewport(true))).toBe(false);
  });

  it('ignores touches on links', () => {
    expect(isCardNavigationTouch(element(['a']), viewport(true))).toBe(false);
  });

  it('ignores touches outside the viewport element', () => {
    expect(isCardNavigationTouch(element([]), viewport(false))).toBe(false);
  });

  it('ignores touches with no target', () => {
    expect(isCardNavigationTouch(null, viewport(true))).toBe(false);
  });

  it('ignores touches on the share menu and the share prompt', () => {
    expect(isCardNavigationTouch(element(['[role="menu"]']), viewport(true))).toBe(false);
    expect(isCardNavigationTouch(element(['[role="dialog"]']), viewport(true))).toBe(false);
  });
});
