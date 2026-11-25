import { describe, expect, it, vi } from 'vitest';
import { dataUrlToFile, getShareMode, shareFile, type ShareEnv } from './webShare';

const png = new File(['x'], 'card.png', { type: 'image/png' });
const env = (overrides: Partial<ShareEnv> = {}): ShareEnv => ({
  canShare: () => true,
  share: vi.fn().mockResolvedValue(undefined),
  writeText: vi.fn().mockResolvedValue(undefined),
  isTouchDevice: true,
  ...overrides,
});
const domError = (name: string) => Object.assign(new Error(name), { name });

describe('getShareMode', () => {
  it('uses native on a touch device that can share the file', () => {
    expect(getShareMode(png, env())).toBe('native');
  });
  it('uses download on desktop even when canShare is true', () => {
    expect(getShareMode(png, env({ isTouchDevice: false }))).toBe('download');
  });
  it('uses download when canShare is missing', () => {
    expect(getShareMode(png, env({ canShare: undefined }))).toBe('download');
  });
  it('uses download when canShare returns false', () => {
    expect(getShareMode(png, env({ canShare: () => false }))).toBe('download');
  });
});

describe('shareFile', () => {
  it('copies the text and shares the file with the text', async () => {
    const e = env();
    expect(await shareFile(png, 'post text', e)).toBe('shared');
    expect(e.writeText).toHaveBeenCalledWith('post text');
    expect(e.share).toHaveBeenCalledWith({ files: [png], text: 'post text' });
  });
  it('returns cancelled on AbortError', async () => {
    const e = env({ share: vi.fn().mockRejectedValue(domError('AbortError')) });
    expect(await shareFile(png, 't', e)).toBe('cancelled');
  });
  it('returns failed on other errors', async () => {
    const e = env({ share: vi.fn().mockRejectedValue(domError('NotAllowedError')) });
    expect(await shareFile(png, 't', e)).toBe('failed');
  });
  it('returns failed when share is missing', async () => {
    expect(await shareFile(png, 't', env({ share: undefined }))).toBe('failed');
  });
  it('still shares when writeText rejects', async () => {
    const e = env({ writeText: vi.fn().mockRejectedValue(domError('NotAllowedError')) });
    expect(await shareFile(png, 't', e)).toBe('shared');
  });
  it('still shares when writeText is missing', async () => {
    expect(await shareFile(png, 't', env({ writeText: undefined }))).toBe('shared');
  });
});

describe('dataUrlToFile', () => {
  it('builds a File with the name and MIME type of the data URL', async () => {
    const file = await dataUrlToFile('data:image/png;base64,iVBORw0KGgo=', 'card.png');
    expect(file.name).toBe('card.png');
    expect(file.type).toBe('image/png');
    expect(file.size).toBe(8);
  });
});
