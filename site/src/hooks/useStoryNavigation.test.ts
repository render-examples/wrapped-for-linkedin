import { describe, expect, it } from 'vitest';
import { storyNavigationReducer } from './useStoryNavigation';

const at = (index: number, backward = false) => ({ index, backward });

describe('storyNavigationReducer', () => {
  it('moves forward to the next card', () => {
    expect(storyNavigationReducer(at(1, true), { type: 'next', totalCards: 5 })).toEqual(at(2));
  });

  it('wraps from the last card to the first card, moving forward', () => {
    expect(storyNavigationReducer(at(4, true), { type: 'next', totalCards: 5 })).toEqual(at(0));
  });

  it('moves backward to the previous card', () => {
    expect(storyNavigationReducer(at(2), { type: 'previous', totalCards: 5 })).toEqual(at(1, true));
  });

  it('wraps from the first card to the last card, moving backward', () => {
    expect(storyNavigationReducer(at(0), { type: 'previous', totalCards: 5 })).toEqual(at(4, true));
  });

  it('jumps forward to a later card', () => {
    expect(storyNavigationReducer(at(1, true), { type: 'jump', index: 3, totalCards: 5 })).toEqual(
      at(3),
    );
  });

  it('jumps backward to an earlier card', () => {
    expect(storyNavigationReducer(at(3), { type: 'jump', index: 1, totalCards: 5 })).toEqual(
      at(1, true),
    );
  });

  it('ignores a jump to a card that does not exist', () => {
    const state = at(2);
    expect(storyNavigationReducer(state, { type: 'jump', index: 5, totalCards: 5 })).toBe(state);
    expect(storyNavigationReducer(state, { type: 'jump', index: -1, totalCards: 5 })).toBe(state);
  });

  it('does nothing when there are no cards', () => {
    const state = at(0);
    expect(storyNavigationReducer(state, { type: 'next', totalCards: 0 })).toBe(state);
    expect(storyNavigationReducer(state, { type: 'previous', totalCards: 0 })).toBe(state);
  });
});
