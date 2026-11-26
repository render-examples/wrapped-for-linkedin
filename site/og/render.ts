/// <reference lib="dom" />
// Render og/og-image.html to public/images/og-image.png at 1200 × 630.
// Run with `npm run og` after design changes.
import { chromium } from 'playwright';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const source = pathToFileURL(path.join(here, 'og-image.html')).href;
const output = path.join(here, '..', 'public', 'images', 'og-image.png');
// Open Graph image size.
const width = 1200;
const height = 630;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width, height } });
  await page.goto(source);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: output, clip: { x: 0, y: 0, width, height } });
  console.log(`Wrote ${path.relative(process.cwd(), output)}`);
} finally {
  await browser.close();
}
