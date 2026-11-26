/**
 * Share exported files through the system share sheet, or download them.
 */

export type ShareMode = 'native' | 'download';
type ShareResult = 'shared' | 'cancelled' | 'failed';

export interface ShareEnv {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
  isTouchDevice: boolean;
}

// Return true when the primary pointer is a finger. A touchscreen laptop has a mouse as its primary pointer.
export function isTouchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

/**
 * Read the share functions from the browser. Each method is bound, because an unbound call throws "Illegal invocation".
 */
function getBrowserShareEnv(): ShareEnv {
  const clipboard = navigator.clipboard;
  return {
    canShare:
      typeof navigator.canShare === 'function' ? navigator.canShare.bind(navigator) : undefined,
    share: typeof navigator.share === 'function' ? navigator.share.bind(navigator) : undefined,
    writeText:
      typeof clipboard?.writeText === 'function' ? clipboard.writeText.bind(clipboard) : undefined,
    isTouchDevice: isTouchDevice(),
  };
}

/**
 * Return true on touch devices that can share files.
 * Desktop share sheets usually do not list LinkedIn, so desktops download the file.
 */
export function canShareFiles(env: ShareEnv = getBrowserShareEnv()): boolean {
  return env.isTouchDevice && typeof env.canShare === 'function';
}

/**
 * Use the share sheet only on touch devices that can share the file.
 */
export function getShareMode(file: File, env: ShareEnv = getBrowserShareEnv()): ShareMode {
  return canShareFiles(env) && env.canShare?.({ files: [file] }) ? 'native' : 'download';
}

/**
 * Copy the post text and open the share sheet with the file.
 * Call this directly from a tap handler. Safari rejects the share if an await comes first.
 */
export async function shareFile(
  file: File,
  text: string,
  env: ShareEnv = getBrowserShareEnv(),
): Promise<ShareResult> {
  if (!env.share) {
    return 'failed';
  }

  // Do not wait for the clipboard. The share sheet must open in the same tick as the tap.
  env.writeText?.(text).catch(() => undefined);

  try {
    await env.share({ files: [file], text });
    return 'shared';
  } catch (error) {
    return error instanceof Error && error.name === 'AbortError' ? 'cancelled' : 'failed';
  }
}

/**
 * Save the file with a temporary download link.
 */
export function downloadFile(file: File): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Revoke later. Some browsers cancel the download if the URL is revoked at once.
  setTimeout(() => URL.revokeObjectURL(url), 40_000);
}

/**
 * Convert a data URL to a File with the same MIME type.
 */
export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const blob = await fetch(dataUrl).then((response) => response.blob());
  return new File([blob], filename, { type: blob.type });
}
