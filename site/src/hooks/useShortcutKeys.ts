import { useEffect, useEffectEvent } from 'react';

// Keys in these elements belong to the element, not to the page.
const OWNS_KEYS_SELECTOR =
  'dialog, [role="dialog"], [role="alertdialog"], [aria-modal="true"], [role="menu"], input, textarea, select, [contenteditable]';
// While one of these is open, page shortcuts do nothing.
const OPEN_OVERLAY_SELECTOR = 'dialog[open], [aria-modal="true"], [role="menu"]';

type ShortcutEvent = Pick<
  KeyboardEvent,
  'target' | 'defaultPrevented' | 'altKey' | 'ctrlKey' | 'metaKey'
>;

/**
 * Return true when a page shortcut must ignore this key event.
 * This is when another handler used the key, a modifier is down, the focus is
 * in a modal, menu, or text field, or a modal or menu is open.
 */
export function isShortcutBlocked(
  event: ShortcutEvent,
  doc: Pick<Document, 'querySelector'>,
): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
    return true;
  }
  const target = event.target as Element | null;
  if (typeof target?.closest === 'function' && target.closest(OWNS_KEYS_SELECTOR)) {
    return true;
  }
  return doc.querySelector(OPEN_OVERLAY_SELECTOR) !== null;
}

/**
 * Call `onKeyDown` for each window keydown that is not blocked.
 * `onKeyDown` always sees the latest props and state.
 */
export function useShortcutKeys(onKeyDown: (event: KeyboardEvent) => void) {
  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    if (!isShortcutBlocked(event, document)) {
      onKeyDown(event);
    }
  });

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
