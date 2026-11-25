import { describe, expect, it } from 'vitest';
import { isShortcutBlocked } from './useShortcutKeys';

// A fake element. closest() finds a match when the element is one of the given tags or roles.
const element = (matches: string[]) =>
  ({
    closest: (selector: string) =>
      selector.split(',').some((part) => matches.includes(part.trim())) ? {} : null,
  }) as unknown as EventTarget;

const keyEvent = (target: EventTarget | null, options: Partial<KeyboardEvent> = {}) => ({
  target,
  defaultPrevented: false,
  altKey: false,
  ctrlKey: false,
  metaKey: false,
  ...options,
});

// A fake document. querySelector() finds an element when `hasOpenModal` is true.
const doc = (hasOpenModal: boolean) => ({ querySelector: () => (hasOpenModal ? {} : null) });

describe('isShortcutBlocked', () => {
  it('allows a key on the page', () => {
    expect(isShortcutBlocked(keyEvent(element([])), doc(false))).toBe(false);
  });

  it('allows a key on a button', () => {
    expect(isShortcutBlocked(keyEvent(element(['button'])), doc(false))).toBe(false);
  });

  it('allows a key when the target is not an element', () => {
    expect(isShortcutBlocked(keyEvent(null), doc(false))).toBe(false);
  });

  it('blocks a key that another handler used', () => {
    expect(isShortcutBlocked(keyEvent(element([]), { defaultPrevented: true }), doc(false))).toBe(
      true,
    );
  });

  it('blocks a key with a modifier', () => {
    expect(isShortcutBlocked(keyEvent(element([]), { altKey: true }), doc(false))).toBe(true);
    expect(isShortcutBlocked(keyEvent(element([]), { ctrlKey: true }), doc(false))).toBe(true);
    expect(isShortcutBlocked(keyEvent(element([]), { metaKey: true }), doc(false))).toBe(true);
  });

  it('blocks a key in a dialog', () => {
    expect(isShortcutBlocked(keyEvent(element(['dialog'])), doc(false))).toBe(true);
    expect(isShortcutBlocked(keyEvent(element(['[role="dialog"]'])), doc(false))).toBe(true);
  });

  it('blocks a key in a menu', () => {
    expect(isShortcutBlocked(keyEvent(element(['[role="menu"]'])), doc(false))).toBe(true);
  });

  it('blocks a key in a text field', () => {
    expect(isShortcutBlocked(keyEvent(element(['input'])), doc(false))).toBe(true);
    expect(isShortcutBlocked(keyEvent(element(['textarea'])), doc(false))).toBe(true);
  });

  it('blocks a key while a modal is open', () => {
    expect(isShortcutBlocked(keyEvent(element([])), doc(true))).toBe(true);
  });
});
