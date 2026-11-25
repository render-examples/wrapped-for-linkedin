// Keep these values the same as the menu min-width and the phone breakpoint in ShareButton.css.
const MENU_WIDTH = 280;
const MENU_GAP = 10;
const PHONE_MAX_WIDTH = 480;

export type MenuPosition = { top: string; left: string };

/**
 * Place the share menu below the button and keep it in the viewport.
 * Returns null on phones, because CSS shows the menu as a bottom sheet there.
 */
export function getMenuPosition(
  button: Pick<DOMRect, 'left' | 'width' | 'bottom'>,
  viewportWidth: number,
): MenuPosition | null {
  if (viewportWidth <= PHONE_MAX_WIDTH) {
    return null;
  }
  const centeredLeft = button.left + button.width / 2 - MENU_WIDTH / 2;
  const left = Math.max(MENU_GAP, Math.min(viewportWidth - MENU_WIDTH - MENU_GAP, centeredLeft));
  return { top: `${button.bottom + MENU_GAP}px`, left: `${left}px` };
}
