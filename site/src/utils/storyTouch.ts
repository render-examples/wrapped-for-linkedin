// A touch that starts on one of these elements does not change the story card.
export const CARD_CONTROL_SELECTOR = 'a, button, input, [role="button"], [role="menu"], [role="dialog"]';

// Return true when a touch on `target` can move to the next or previous card.
// Touches from portals (the share menu and the share prompt) reach the viewport
// through React, but the viewport element does not contain them.
export function isCardNavigationTouch(target: Element | null, viewport: Element): boolean {
  if (!target || !viewport.contains(target)) return false;
  return target.closest(CARD_CONTROL_SELECTOR) === null;
}
