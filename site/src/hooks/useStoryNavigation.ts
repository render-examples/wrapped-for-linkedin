import { useCallback, useReducer } from 'react';

interface StoryNavigationState {
  index: number;
  // True when the last move went to an earlier card. The progress bar uses it.
  backward: boolean;
}

type StoryNavigationAction =
  | { type: 'next'; totalCards: number }
  | { type: 'previous'; totalCards: number }
  | { type: 'jump'; index: number; totalCards: number };

/**
 * Move between story cards. Next and previous wrap around at the ends.
 */
export function storyNavigationReducer(
  state: StoryNavigationState,
  action: StoryNavigationAction,
): StoryNavigationState {
  const { totalCards } = action;
  if (totalCards === 0) {
    return state;
  }

  switch (action.type) {
    case 'next':
      return { index: (state.index + 1) % totalCards, backward: false };
    case 'previous':
      return { index: (state.index - 1 + totalCards) % totalCards, backward: true };
    case 'jump':
      if (action.index < 0 || action.index >= totalCards) {
        return state;
      }
      return { index: action.index, backward: action.index < state.index };
  }
}

/**
 * The current story card, and functions that move to another card.
 */
export function useStoryNavigation(totalCards: number) {
  const [state, dispatch] = useReducer(storyNavigationReducer, { index: 0, backward: false });

  const next = useCallback(() => dispatch({ type: 'next', totalCards }), [totalCards]);
  const previous = useCallback(() => dispatch({ type: 'previous', totalCards }), [totalCards]);
  const jumpTo = useCallback(
    (index: number) => dispatch({ type: 'jump', index, totalCards }),
    [totalCards],
  );

  return { currentIndex: state.index, isBackward: state.backward, next, previous, jumpTo };
}
