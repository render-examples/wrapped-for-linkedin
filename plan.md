# Web Share Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** On phones and tablets, let users send an exported card or PDF straight to the LinkedIn app through the system share sheet. On desktop, keep the current download flow.

**Architecture:** A new `site/src/utils/webShare.ts` module decides the share mode and wraps `navigator.share`, `navigator.canShare`, and the clipboard. Export code returns a `File` instead of saving it. `ShareButton` then downloads the file (desktop) or shows a new `NativeSharePrompt` modal with a **Share to LinkedIn** button (touch devices). The share call runs from that button, not from the end of the export, because exports take several seconds and Safari rejects `navigator.share` once the original tap is that old.

**Tech Stack:** React 19, TypeScript, Vite, Vitest (Node environment, no DOM library), jsPDF, Web Share API Level 2.

**Spec:** None. This plan is the spec.

## Global Constraints

- The analytics file and the rendered cards stay in the browser. Only the OS share sheet, which the user opens, receives the file.
- Use the native share flow only when `navigator.canShare({ files: [file] })` returns `true` and `matchMedia('(pointer: coarse)').matches` is `true`. Everything else uses the download flow. Desktop share sheets on macOS and Windows usually don't list LinkedIn, so desktop stays on the download flow even when `canShare` is `true`.
- Every path that can't share must end in a downloaded file and the existing `DownloadInstructions` modal.
- Import with the path aliases in `site/tsconfig.app.json`. Put styles in `site/src/styles/`, one CSS file per component.
- Run `cd site && npm run lint && npm test && npm run build` before each commit.
- Use Conventional Commits and end each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Slow exports.** A cold screenshot service can take 30 seconds or more. The share must still open, because it runs from a new tap in the prompt. Task 3, Step 6 checks this by hand.
2. **The user closes the share sheet.** `navigator.share` rejects with `AbortError`. The prompt stays open, with no error and no download. Test: `returns cancelled on AbortError` in Task 1.
3. **The share call fails.** For example, `NotAllowedError` when the browser decides the tap is too old. The app downloads the file and switches to `DownloadInstructions`. Test: `returns failed on other errors` in Task 1.
4. **The clipboard is missing or denied.** Some browsers block `writeText` or don't have it. The share still opens. Tests: `still shares when writeText rejects` and `still shares when writeText is missing` in Task 1.
5. **A Mac or a touchscreen laptop.** `canShare` is `true` but the primary pointer is fine, so the app uses the download flow. Test: `uses download on desktop even when canShare is true` in Task 1.

---

### Task 1: Share utility

**Files:**
- Create: `site/src/utils/webShare.ts`
- Test: `site/src/utils/webShare.test.ts`

**Interfaces:**
- Produces:
  - `type ShareMode = 'native' | 'download'`
  - `type ShareResult = 'shared' | 'cancelled' | 'failed'`
  - `interface ShareEnv { canShare?: (data: ShareData) => boolean; share?: (data: ShareData) => Promise<void>; writeText?: (text: string) => Promise<void>; isTouchDevice: boolean }`
  - `getBrowserShareEnv(): ShareEnv`
  - `getShareMode(file: File, env?: ShareEnv): ShareMode`
  - `shareFile(file: File, text: string, env?: ShareEnv): Promise<ShareResult>`
  - `downloadFile(file: File): void`
  - `dataUrlToFile(dataUrl: string, filename: string): Promise<File>`

- [ ] **Step 1: Write the failing tests**

```ts
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `cd site && npx vitest run src/utils/webShare.test.ts`
Expected: FAIL, because `./webShare` does not exist.

- [ ] **Step 3: Implement `site/src/utils/webShare.ts`**

- `getBrowserShareEnv` binds `navigator.share`, `navigator.canShare`, and `navigator.clipboard.writeText` to their objects, because calling them unbound throws `Illegal invocation`. It sets `isTouchDevice` from `window.matchMedia('(pointer: coarse)').matches`. Each field is `undefined` when the browser lacks the method.
- `getShareMode` and `shareFile` default `env` to `getBrowserShareEnv()`.
- `shareFile` must call `share` in the same tick as the tap. Start `writeText` without `await` and swallow its rejection, then `await share(...)`. An `await` before `share` can use up the tap in Safari.
- `downloadFile` makes an object URL, clicks a temporary `<a download>`, and revokes the URL. Move this logic out of `ShareButton.tsx`.
- `dataUrlToFile` uses `fetch(dataUrl).then((r) => r.blob())`.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `cd site && npx vitest run src/utils/webShare.test.ts`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add site/src/utils/webShare.ts site/src/utils/webShare.test.ts
git commit -m "feat: add Web Share helpers with a download fallback"
```

### Task 2: PDF export returns a Blob

**Files:**
- Modify: `site/src/exports/pdfExport.ts`
- Modify: `site/src/exports/README.md`

**Interfaces:**
- Produces: `buildCardsPDF(cardElements: HTMLElement[], options?: PDFExportOptions): Promise<Blob>`. It replaces `exportCardsAsPDFBatch`. The caller decides whether to save or share the result.

- [ ] **Step 1: Rename `exportCardsAsPDFBatch` to `buildCardsPDF` and drop the `filename` parameter**

Replace `pdf.save(filename)` with `return pdf.output('blob')`. Keep the error wrapping and the empty-input check.

- [ ] **Step 2: Update `site/src/exports/README.md`**

Replace each `exportCardsAsPDFBatch` reference with `buildCardsPDF`. State that the function returns a PDF `Blob` and does not download it.

- [ ] **Step 3: Run the checks**

Run: `cd site && npm run lint && npm test && npm run build`
Expected: The build fails in `ShareButton.tsx`, which still imports `exportCardsAsPDFBatch`. Task 3 fixes this. Commit Task 2 together with Task 3.

### Task 3: Share prompt and ShareButton wiring

**Files:**
- Create: `site/src/components/WrappedStories/NativeSharePrompt.tsx`
- Create: `site/src/styles/NativeSharePrompt.css`
- Modify: `site/src/components/WrappedStories/ShareButton.tsx:75-158` (both export handlers) and `:252-261` (modal rendering)
- Modify: `site/src/README.md:179` (component list)

**Interfaces:**
- Consumes: everything Task 1 produces, `buildCardsPDF` from Task 2, `buildShareText(input: ShareTextInput): string` from `@utils/linkedinShareLink`.
- Produces: `NativeSharePrompt: React.FC<{ file: File; shareInfo: ShareInfo; exportType: 'current-card' | 'all-cards'; onShared: () => void; onFallback: () => void; onDismiss: () => void }>`

- [ ] **Step 1: Build `NativeSharePrompt`**

Reuse the overlay, modal, and header classes from `DownloadInstructions`. Put only new rules in `NativeSharePrompt.css`. Use this copy:

- Title: "Your card is ready" for `current-card`, or "Your cards are ready" for `all-cards`.
- Primary button: "Share to LinkedIn", with the LinkedIn logo used in `DownloadInstructions`.
- Body: "Tap Share to LinkedIn, then pick LinkedIn. We copied your post text, so paste it into your post."
- Secondary button: "Download instead". It calls `onFallback`.

The primary button calls `shareFile(file, buildShareText(shareInfo))` and handles the result:

- `'shared'` calls `onShared`.
- `'cancelled'` does nothing.
- `'failed'` calls `onFallback`.

Disable the button while the share is pending, so a double tap can't open two share sheets.

- [ ] **Step 2: Make both export handlers in `ShareButton` produce a `File`**

- PNG: `dataUrlToFile(imageDataUrl, \`wrapped-for-linkedin-${card.id}.png\`)`.
- PDF: `new File([await buildCardsPDF(cardElements, { postImage })], \`wrapped_${shareInfo.year}.pdf\`, { type: 'application/pdf' })`.

Then store the file in a new `exportedFile` state and set a new `shareMode` state with `getShareMode(file)`. If the mode is `'download'`, call `downloadFile(file)`. In both modes, set `showInstructions` to `true`. Remove the inline anchor download code.

- [ ] **Step 3: Render the right modal**

When `showInstructions` is `true`, render `NativeSharePrompt` if `shareMode === 'native'`, and `DownloadInstructions` otherwise. Wire the callbacks:

- `onShared` and `onDismiss` close the modal.
- `onFallback` calls `downloadFile(exportedFile)` and sets `shareMode` to `'download'`, so the same portal switches to `DownloadInstructions`.

- [ ] **Step 4: Add `NativeSharePrompt.tsx` to the component list in `site/src/README.md`**

- [ ] **Step 5: Run the checks**

Run: `cd site && npm run lint && npm test && npm run build`
Expected: all pass.

- [ ] **Step 6: Check both flows in a desktop browser**

Start the site with `bin/preview.sh` and load the sample data.

1. In desktop Chrome with no emulation, export a PNG and a PDF. Both download, and `DownloadInstructions` opens as before.
2. In Chrome DevTools, turn on device emulation for an iPhone. This makes `(pointer: coarse)` match. Export a PNG. `NativeSharePrompt` opens and nothing downloads. Tap **Share to LinkedIn**. The desktop share sheet opens. Close it, and the prompt stays open.
3. With emulation still on, tap **Download instead**. The file downloads and the modal switches to `DownloadInstructions`.
4. Stop the screenshot service, or point `VITE_SCREENSHOT_SERVICE_URL` at a URL that hangs, and export the Peak Performer card with emulation on. After the export finishes, **Share to LinkedIn** still opens the share sheet.

- [ ] **Step 7: Commit**

```bash
git add site/src/exports site/src/components/WrappedStories site/src/styles/NativeSharePrompt.css site/src/README.md
git commit -m "feat: share exported cards to the LinkedIn app on phones"
```

### Task 4: Test on real phones

The Web Share API needs HTTPS. A phone that opens the dev server by its LAN IP address can't use it. Use one of these:

- Run `cloudflared tunnel --url http://localhost:5173` and open the HTTPS URL it prints.
- Deploy the branch to a Render pull request preview. Turn on previews for the static site in the Render Dashboard first.

Post screenshots fall back to the placeholder on both URLs, because `ALLOWED_ORIGIN` only allows the production domain. That doesn't affect this test.

- [ ] **Step 1: iPhone Safari, PNG.** LinkedIn appears in the share sheet. The post opens with the image attached. Pasting adds the post text.
- [ ] **Step 2: Android Chrome, PNG.** Same checks as Step 1.
- [ ] **Step 3: iPhone and Android, PDF.** Check whether LinkedIn appears in the share sheet for a PDF. If it doesn't appear on either platform, make `getShareMode` return `'download'` when `file.type === 'application/pdf'`. Add a test named `uses download for PDFs`, then commit with `fix: download PDFs on phones because LinkedIn does not accept them from the share sheet`.
- [ ] **Step 4: Link preview.** Check whether the URL in the pasted text replaces the attached image with a link preview. If it does, note it in the prompt body copy.
- [ ] **Step 5: Firefox on Android.** It doesn't support file sharing, so the export downloads and `DownloadInstructions` opens.
