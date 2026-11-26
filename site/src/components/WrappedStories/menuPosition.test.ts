import { describe, expect, it } from 'vitest';
import { getMenuPosition } from '@components/WrappedStories/menuPosition';

describe('getMenuPosition', () => {
  it('returns null on phones, so CSS places the menu', () => {
    expect(getMenuPosition({ left: 100, width: 80, bottom: 200 }, 480)).toBeNull();
  });

  it('centers the menu below the button', () => {
    expect(getMenuPosition({ left: 400, width: 80, bottom: 200 }, 1200)).toEqual({
      top: '210px',
      left: '300px',
    });
  });

  it('keeps the menu inside the left edge', () => {
    expect(getMenuPosition({ left: 0, width: 80, bottom: 200 }, 1200)?.left).toBe('10px');
  });

  it('keeps the menu inside the right edge', () => {
    expect(getMenuPosition({ left: 1150, width: 50, bottom: 200 }, 1200)?.left).toBe('910px');
  });
});
