# Mobile UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the problems that phone users hit in Wrapped for LinkedIn, including the new Web Share flow, and leave the desktop UI unchanged.

**Architecture:** Most changes are CSS inside phone-width media queries (`max-width: 480px` or `768px`) or `@media (hover: hover)`, so desktop styles stay the same. The TypeScript changes are a touch-target filter for card navigation, a scroll reset when the view changes, and "Tap" copy on touch devices. A Playwright check script proves each phone fix and compares desktop screenshots before and after.

**Tech Stack:** React 19, TypeScript, Vite, Vitest (Node environment, no DOM library), Playwright from `screenshot-service/` for browser checks.

**Spec:** None. This plan is the spec. The previous plan in this file (Web Share) is complete and is in git history at commit `5f1638a`.

## Problems found

A phone-width check (375 × 667, touch enabled) on commit `cf052e7` found these problems:

1. **Tapping Share changes the card.** The tap on the card's **Share** button also counts as a tap on the right half of the card, so the card moves forward. "Export current card as a PNG" then exports the wrong card. A tap on a progress bar or on the menu backdrop also moves the card, because the touch handler on `.story-viewport` gets every touch, including touches in the menu portal.
2. **The cards open half off screen.** A phone user scrolls down to tap **Try with sample data** or to upload. The dashboard then opens at the same scroll position (`scrollY` 380), so the active card is cut off under the fixed header.
3. **Tap targets are too small.** The header title button is 20px high, the Render link is 19px, the progress bars are 2px, and the card **Share** button is 35px. The minimum is 44px.
4. **Hover styles stick after a tap.** iOS keeps `:hover` on the last tapped element, so the **Share** button and other controls stay in the accent color after a tap.
5. **The share menu and the share prompt open in the middle of the screen.** Phone users reach the bottom of the screen with a thumb more easily. iOS and Android show share and action menus as bottom sheets.
6. **The copy says "click" and "drag and drop" on phones.** The upload box says "Drag and drop or click to select a file". The download steps say "Click" and "clicking".
7. **The share prompt says "We copied your post text" before the copy happens.** The copy runs when the user taps **Share to LinkedIn**.

## Global Constraints

- Do not change the desktop UI. At 1440 × 900 with a mouse, the screenshots in Task 6 must match the baseline from Task 1.
- Put phone-only CSS inside `@media (max-width: 480px)` or `@media (max-width: 768px)`, using the breakpoint that the file already uses. Put hover styles inside `@media (hover: hover)`.
- The analytics file stays in the browser. Do not add network calls.
- Import with the path aliases in `site/tsconfig.app.json`. Put styles in `site/src/styles/`, one CSS file per component. Put tests next to the file they test.
- Run `cd site && npm run lint && npm test && npm run build` before each commit. `npm run lint` already reports 14 problems in files this plan does not change. A commit must not add new ones.
- Use Conventional Commits in plain English. End each commit message with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Check script

Save this script outside the repo as `$TMPDIR/mobile-check.mjs`. Run it from the repo root while the dev server runs on port 5173 (`bin/preview.sh`). It loads Playwright from `screenshot-service/`, so run `npm install` there first if `screenshot-service/node_modules` is missing.

```js
// node $TMPDIR/mobile-check.mjs desktop <dir>   Save desktop screenshots to <dir>.
// node $TMPDIR/mobile-check.mjs phone <dir>     Save phone screenshots to <dir> and print the phone checks.
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(path.resolve('screenshot-service/package.json'));
const { chromium } = require('playwright');
const [mode, out] = process.argv.slice(2);
const URL = 'http://localhost:5173/';
const shot = (page, name) => page.screenshot({ path: `${out}/${name}.png`, animations: 'disabled' });
const browser = await chromium.launch();

if (mode === 'desktop') {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(800);
  await shot(page, 'upload');
  await page.locator('.sample-data-button').click();
  await page.locator('.story-card.active .share-button').waitFor({ timeout: 20000 });
  await page.locator('.autoplay-button').click();
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(800);
  await shot(page, 'stories');
  await page.locator('.story-card.active .share-button').click();
  await page.waitForTimeout(400);
  await shot(page, 'menu');
  await page.getByRole('menuitem', { name: /PNG/ }).click();
  await page.getByText('Download complete').waitFor({ timeout: 60000 });
  await shot(page, 'instructions');
} else {
  const ctx = await browser.newContext({
    viewport: { width: 375, height: 667 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, acceptDownloads: true,
  });
  await ctx.addInitScript(() => {
    navigator.canShare = () => true;
    navigator.share = () => Promise.reject(Object.assign(new Error('cancel'), { name: 'AbortError' }));
  });
  const page = await ctx.newPage();
  await page.goto(URL);
  await page.waitForTimeout(800);
  await shot(page, 'upload');
  await page.locator('.sample-data-button').tap();
  await page.locator('.story-card.active .share-button').waitFor({ timeout: 20000 });
  await page.waitForTimeout(500);
  console.log('scrollY after load:', await page.evaluate(() => scrollY));
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator('.autoplay-button').tap();
  const active = () => page.locator('.story-card.active').getAttribute('aria-label');
  const first = await active();
  await page.locator('.story-card.active .share-button').tap();
  await page.waitForTimeout(400);
  const afterShare = await active();
  console.log('card kept after Share tap:', afterShare === first);
  await shot(page, 'menu');
  await page.locator('.share-dropdown-backdrop').tap({ position: { x: 20, y: 100 } });
  await page.waitForTimeout(300);
  console.log('card kept after backdrop tap:', (await active()) === afterShare);
  const beforeCardTap = await active();
  const box = await page.locator('.story-card.active').boundingBox();
  await page.touchscreen.tap(box.x + box.width * 0.75, box.y + box.height / 2);
  await page.waitForTimeout(300);
  console.log('card changed after tap on card:', (await active()) !== beforeCardTap);
  console.log('small targets:', JSON.stringify(await page.evaluate(() =>
    [...document.querySelectorAll('.story-card.active button, .story-card.active [role=button], .app-header a, .app-header button, .story-controls button')]
      .map((el) => [el, el.getBoundingClientRect()])
      .filter(([, r]) => r.width > 0 && r.height < 44)
      .map(([el, r]) => `${el.className} ${Math.round(r.width)}x${Math.round(r.height)}`))));
  await page.locator('.story-card.active .share-button').tap();
  await page.getByRole('menuitem', { name: /PNG/ }).tap();
  await page.getByText('Your card is ready').waitFor({ timeout: 60000 });
  await shot(page, 'prompt');
  await page.getByRole('button', { name: /Download instead/ }).tap();
  await page.getByText('Download complete').waitFor();
  await shot(page, 'instructions');
}
await browser.close();
```

On commit `cf052e7`, `phone` prints this:

```
scrollY after load: 380
card kept after Share tap: false
card kept after backdrop tap: false
card changed after tap on card: true
small targets: ["wrapped-for-linkedin-title-container 165x20","render-logo-link 160x19","progress-bar completed 30x2", ... ,"share-button 89x35"]
```

## Review Focus

1. **A tap that starts on a control and ends on the card.** The filter in Task 2 runs on `touchstart`, so the touch is ignored from start to end. A swipe that starts on the **Share** button must not change the card either. Test: `ignores touches on buttons` in Task 2.
2. **Touches in a portal.** The share menu, its backdrop, and the share prompt render through `createPortal`, but React still sends their touch events to `.story-viewport`. Test: `ignores touches outside the viewport element` in Task 2.
3. **A touchscreen laptop.** It has a fine primary pointer and `hover: hover`, so it keeps the desktop copy and the desktop hover styles. Test: `returns false when the primary pointer is fine` in Task 5.
4. **A narrow desktop window.** The bottom sheets in Task 4 use `max-width: 480px`, so a desktop window that narrow also gets them. The share menu already changed layout at 480px before this plan, so this is not a new desktop change.
5. **Reduced motion.** The bottom-sheet animation in Task 4 must stop when the user sets reduced motion. The global rule in `site/src/index.css` already covers this. Task 4, Step 3 checks it by hand.

---

### Task 1: Save the desktop baseline

**Files:** None in the repo.

- [ ] **Step 1: Start the dev server and save the check script**

Run `bin/preview.sh` in a second terminal. Save the [check script](#check-script) as `$TMPDIR/mobile-check.mjs`.

- [ ] **Step 2: Save the desktop and phone baselines**

Run from the repo root:

```bash
mkdir -p "$TMPDIR/base-desktop" "$TMPDIR/base-phone"
node "$TMPDIR/mobile-check.mjs" desktop "$TMPDIR/base-desktop"
node "$TMPDIR/mobile-check.mjs" phone "$TMPDIR/base-phone"
```

Expected: `base-desktop` has `upload.png`, `stories.png`, `menu.png`, and `instructions.png`. The phone output matches the output in [Check script](#check-script).

- [ ] **Step 3: Make sure the desktop screenshots repeat**

Run the `desktop` command again into `$TMPDIR/base-desktop-2`, then `cmp` each file with the one in `$TMPDIR/base-desktop`.
Expected: All four files are the same. If a file differs with no code change, the byte comparison in Tasks 4 and 6 cannot work for that file, so compare that file by eye instead.

---

### Task 2: Stop taps on controls from changing the card

**Files:**
- Create: `site/src/utils/storyTouch.ts`
- Create: `site/src/utils/storyTouch.test.ts`
- Modify: `site/src/components/WrappedStories/WrappedStoriesContainer.tsx` (`handleTouchStart`)
- Modify: `site/src/README.md` (the `WrappedStoriesContainer.tsx` section and the file tree)

**Interfaces:**
- Produces: `isCardNavigationTouch(target: Element | null, viewport: Element): boolean` and `CARD_CONTROL_SELECTOR: string` in `@utils/storyTouch`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, expect, it } from 'vitest';
import { CARD_CONTROL_SELECTOR, isCardNavigationTouch } from './storyTouch';

const viewport = (containsTarget: boolean) => ({ contains: () => containsTarget }) as unknown as Element;
// A fake element. closest() finds a match when the element is one of the given tags or roles.
const element = (matches: string[]) =>
  ({
    closest: (selector: string) =>
      selector.split(',').some((part) => matches.includes(part.trim())) ? {} : null,
  }) as unknown as Element;

describe('isCardNavigationTouch', () => {
  it('accepts touches on card content', () => {
    expect(isCardNavigationTouch(element([]), viewport(true))).toBe(true);
  });

  it('ignores touches on buttons', () => {
    expect(isCardNavigationTouch(element(['button']), viewport(true))).toBe(false);
  });

  it('ignores touches on progress bars', () => {
    expect(isCardNavigationTouch(element(['[role="button"]']), viewport(true))).toBe(false);
  });

  it('ignores touches on links', () => {
    expect(isCardNavigationTouch(element(['a']), viewport(true))).toBe(false);
  });

  it('ignores touches outside the viewport element', () => {
    expect(isCardNavigationTouch(element([]), viewport(false))).toBe(false);
  });

  it('ignores touches with no target', () => {
    expect(isCardNavigationTouch(null, viewport(true))).toBe(false);
  });

  it('lists the menu and dialog roles as controls', () => {
    expect(CARD_CONTROL_SELECTOR).toContain('[role="menu"]');
    expect(CARD_CONTROL_SELECTOR).toContain('[role="dialog"]');
  });
});
```

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `cd site && npx vitest run src/utils/storyTouch.test.ts`
Expected: FAIL, because `./storyTouch` does not exist.

- [ ] **Step 3: Implement `site/src/utils/storyTouch.ts`**

`CARD_CONTROL_SELECTOR` is `'a, button, input, [role="button"], [role="menu"], [role="dialog"]'`. `isCardNavigationTouch` returns `false` when `target` is `null`, when `viewport.contains(target)` is `false` (the touch came from a portal), or when `target.closest(CARD_CONTROL_SELECTOR)` is not `null`. Otherwise it returns `true`.

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `cd site && npx vitest run src/utils/storyTouch.test.ts`
Expected: 7 tests pass.

- [ ] **Step 5: Use the filter in `handleTouchStart`**

At the start of `handleTouchStart` in `WrappedStoriesContainer.tsx`, call `isCardNavigationTouch(e.target as Element, e.currentTarget)`. If it returns `false`, set `touchStartXRef.current` to `null` and return. `handleTouchEnd` already returns when that ref is `null`. Change the parameter type to `React.TouchEvent<HTMLDivElement>`. Do not change the pointer handlers.

In `site/src/README.md`, add `storyTouch.ts` to the file tree under `utils/` with the comment `# Decide which taps change the story card`. In the `WrappedStoriesContainer.tsx` section, add `- Taps on buttons, links, progress bars, and menus do not change the card`.

- [ ] **Step 6: Check it in the browser**

Run: `node "$TMPDIR/mobile-check.mjs" phone "$TMPDIR/task2"`
Expected: `card kept after Share tap: true`, `card kept after backdrop tap: true`, and `card changed after tap on card: true`.

- [ ] **Step 7: Commit**

```bash
cd site && npm run lint && npm test && npm run build && cd ..
git add site/src/utils/storyTouch.ts site/src/utils/storyTouch.test.ts site/src/components/WrappedStories/WrappedStoriesContainer.tsx site/src/README.md
git commit -m "fix: stop taps on card controls from changing the card

On phones, a tap on Share also counted as a tap on the right half of
the card. The card moved forward, so the PNG export used the wrong card.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Open each view at the top of the page

**Files:**
- Modify: `site/src/App.tsx` (`handleFileProcessed`, `resetState`)

There is no DOM library in the test setup, so the check script verifies this task.

- [ ] **Step 1: Scroll to the top when the view changes**

Call `window.scrollTo(0, 0)` in `handleFileProcessed` after the success `setState`, and in `resetState` after its `setState`. Do not call it on the error path, because the error shows above the upload box and the user is already there.

This also runs on desktop. It changes desktop behavior only when the user scrolled down on the upload page, and then the desktop had the same bug.

- [ ] **Step 2: Check it in the browser**

Run: `node "$TMPDIR/mobile-check.mjs" phone "$TMPDIR/task3"`
Expected: `scrollY after load: 0`.

- [ ] **Step 3: Commit**

```bash
cd site && npm run lint && npm test && npm run build && cd ..
git add site/src/App.tsx
git commit -m "fix: open the dashboard and the upload page at the top

On phones, users scroll down to upload a file or load sample data. The
dashboard then opened at the same scroll position, and the fixed header
covered the card.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Fix touch targets, hover styles, and the share sheets

**Files:**
- Modify: `site/src/index.css`, `site/src/styles/Header.css`, `site/src/styles/FileUpload.css`, `site/src/styles/SampleDataButton.css`, `site/src/styles/TopPostsDisplay.css`, `site/src/styles/ShareButton.css`, `site/src/styles/WrappedStories.css`, `site/src/styles/NativeSharePrompt.css`
- Modify: `site/src/components/WrappedStories/NativeSharePrompt.tsx` (overlay class and copy)

This task changes CSS and copy only. The check script and the screenshots verify it.

- [ ] **Step 1: Put every hover rule inside `@media (hover: hover)`**

Wrap each `:hover` rule in the files above in `@media (hover: hover) { ... }`. List them with `grep -n ':hover' site/src/index.css site/src/styles/*.css`. In `FileUpload.css`, split `.dropzone:hover:not(.disabled), .dropzone.active` into two rules and keep `.dropzone.active` outside the media query, because it is the drag state.

- [ ] **Step 2: Make the tap targets at least 44px high on phones**

Add these rules inside the existing `@media (max-width: 768px)` block of each file:

- `Header.css`: `.wrapped-for-linkedin-title-container` and `.render-logo-link` get `min-height: 44px`.
- `ShareButton.css`: `.share-button` gets `min-height: 44px`.
- `WrappedStories.css`: `.progress-bar` gets `height: 22px` and `background: linear-gradient(var(--border), var(--border)) center / 100% 2px no-repeat`. `.progress-fill` gets `height: 2px` and `margin-top: 10px`. The bars look the same, but each tap area is 22px high. The bars sit above the card content, so a taller area would push the card down.

Add this rule inside the existing `@media (max-width: 480px)` block of `WrappedStories.css`: `.instructions-close-btn` gets `width: 44px` and `height: 44px`.

- [ ] **Step 3: Show the share menu and the share prompt as bottom sheets on phones**

In `ShareButton.css`, inside `@media (max-width: 480px)`, replace the centered `.share-dropdown-menu` rule. The menu gets `top: auto !important`, `bottom: 0`, `left: 0 !important`, `right: 0`, `transform: none !important`, `min-width: 0`, `max-width: none`, `border-width: 1px 0 0`, `padding-bottom: env(safe-area-inset-bottom)`, and `animation: slideUpSheet 0.2s ease`. Add `@keyframes slideUpSheet` from `transform: translateY(100%)` to `transform: translateY(0)`. Do not change `getDropdownPosition` in `ShareButton.tsx`, because the `!important` rules override its values on phones.

In `NativeSharePrompt.tsx`, add the class `native-share-overlay` to the overlay `div` next to `download-instructions-overlay`. In `NativeSharePrompt.css`, inside `@media (max-width: 480px)`, give `.native-share-overlay` `align-items: flex-end`, and give `.native-share-overlay .download-instructions-modal` `border-width: 1px 0 0`, `padding-bottom: env(safe-area-inset-bottom)`, and `animation: slideUpSheet 0.2s ease`. `DownloadInstructions` keeps its full-screen layout on phones, because its steps and images need the height.

Check reduced motion by hand. In Chrome DevTools, open the Rendering panel, set **Emulate CSS media feature prefers-reduced-motion** to `reduce`, and open the share menu at 375px wide. The menu must appear without sliding.

- [ ] **Step 4: Fix the prompt copy**

In `NativeSharePrompt.tsx`, change the text to:

```tsx
Tap <b>Share to LinkedIn</b>, then pick LinkedIn. We also copy your post text, so you can paste it into your post.
```

- [ ] **Step 5: Check it in the browser**

Run: `node "$TMPDIR/mobile-check.mjs" phone "$TMPDIR/task4"`
Expected: `small targets: []`. Open `$TMPDIR/task4/menu.png` and `$TMPDIR/task4/prompt.png`. The menu and the prompt touch the bottom edge of the screen and fill its width.

Run: `node "$TMPDIR/mobile-check.mjs" desktop "$TMPDIR/task4-desktop"`, then `cmp` each file with the one in `$TMPDIR/base-desktop`.
Expected: All four files are the same. If a file differs, open both images. A difference you can see is a desktop change, so fix it before you commit.

- [ ] **Step 6: Commit**

```bash
cd site && npm run lint && npm test && npm run build && cd ..
git add site/src/index.css site/src/styles site/src/components/WrappedStories/NativeSharePrompt.tsx
git commit -m "style: improve tap targets and share sheets on phones

Make the header links, the Share button, the progress bars, and the
close button at least 44px high on phones. Show the share menu and the
share prompt as bottom sheets. Apply hover styles only on devices that
can hover, so a tapped button does not stay highlighted.

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Say "tap" on touch devices

**Files:**
- Modify: `site/src/utils/webShare.ts`
- Modify: `site/src/utils/webShare.test.ts`
- Modify: `site/src/components/FileUpload.tsx`
- Modify: `site/src/components/WrappedStories/DownloadInstructions.tsx`

**Interfaces:**
- Produces: `isTouchDevice(): boolean` in `@utils/webShare`. `getBrowserShareEnv` uses it for `isTouchDevice`.

- [ ] **Step 1: Write the failing tests**

Add to `webShare.test.ts`:

```ts
describe('isTouchDevice', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('returns true when the primary pointer is coarse', () => {
    vi.stubGlobal('window', { matchMedia: (query: string) => ({ matches: query === '(pointer: coarse)' }) });
    expect(isTouchDevice()).toBe(true);
  });

  it('returns false when the primary pointer is fine', () => {
    vi.stubGlobal('window', { matchMedia: () => ({ matches: false }) });
    expect(isTouchDevice()).toBe(false);
  });
});
```

Import `afterEach` and `vi` from `vitest` and `isTouchDevice` from `./webShare` if the file does not import them yet.

- [ ] **Step 2: Run the tests to make sure they fail**

Run: `cd site && npx vitest run src/utils/webShare.test.ts`
Expected: FAIL, because `isTouchDevice` is not exported.

- [ ] **Step 3: Implement `isTouchDevice` in `webShare.ts`**

Move the `window.matchMedia('(pointer: coarse)').matches` check from `getBrowserShareEnv` into `export function isTouchDevice(): boolean`, and call it from `getBrowserShareEnv`.

- [ ] **Step 4: Run the tests to make sure they pass**

Run: `cd site && npx vitest run src/utils/webShare.test.ts`
Expected: 13 tests pass.

- [ ] **Step 5: Change the copy on touch devices**

In each component, read `isTouchDevice()` once per render.

- `FileUpload.tsx`: on touch devices, the subtext is `Tap to choose a file`. Other devices keep `Drag and drop or click to select a file`.
- `DownloadInstructions.tsx`: on touch devices, change `Click` to `Tap` and `clicking` to `tapping` in each step and in the image `alt` text. Other devices keep the current text. Do not change the images.

- [ ] **Step 6: Check it in the browser**

Run: `node "$TMPDIR/mobile-check.mjs" phone "$TMPDIR/task5"`
Expected: `$TMPDIR/task5/upload.png` shows "Tap to choose a file". `$TMPDIR/task5/instructions.png` shows "Tap the button above".

- [ ] **Step 7: Commit**

```bash
cd site && npm run lint && npm test && npm run build && cd ..
git add site/src/utils/webShare.ts site/src/utils/webShare.test.ts site/src/components/FileUpload.tsx site/src/components/WrappedStories/DownloadInstructions.tsx
git commit -m "fix: say tap instead of click on touch devices

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Verify desktop and test on a real phone

**Files:** None, unless a check fails.

- [ ] **Step 1: Compare the desktop screenshots**

Run:

```bash
mkdir -p "$TMPDIR/final-desktop"
node "$TMPDIR/mobile-check.mjs" desktop "$TMPDIR/final-desktop"
for f in upload stories menu instructions; do cmp "$TMPDIR/base-desktop/$f.png" "$TMPDIR/final-desktop/$f.png" && echo "$f same"; done
```

Expected: `upload same`, `stories same`, `menu same`, and `instructions same`.

- [ ] **Step 2: Run the phone checks one more time**

Run: `node "$TMPDIR/mobile-check.mjs" phone "$TMPDIR/final-phone"`
Expected:

```
scrollY after load: 0
card kept after Share tap: true
card kept after backdrop tap: true
card changed after tap on card: true
small targets: []
```

- [ ] **Step 3: Test on a real phone**

Deploy a preview, or open the dev server from a phone on the same network with `npx vite --host` in `site/`. On an iPhone with Safari and on an Android phone with Chrome, check each item:

1. Scroll down, tap **Try with sample data**. The first card shows in full under the header.
2. Tap **Share** on a card. The card does not change, and the menu slides up from the bottom.
3. Tap **PNG**. The prompt slides up from the bottom. Tap **Share to LinkedIn**. The share sheet opens and lists LinkedIn.
4. Pick LinkedIn. The post has the card attached, and you can paste the post text.
5. Do steps 2 to 4 again with **PDF**.
6. Close the share sheet without sharing. The prompt stays open.
7. Tap **Download instead**. The file downloads, and the steps say "Tap".
8. Tap **Share**, close the menu, then tap a progress bar. The card jumps to that bar, and no button stays in the accent color after you lift your finger.

Write down any step that fails, with the phone and browser. This plan does not include fixes for those failures.
