// og-image.html copies the design tokens from src/index.css, because the page has no build step.
// This test fails when a copied token no longer matches index.css.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (relativePath: string) => readFileSync(new URL(relativePath, import.meta.url), 'utf8');

// Get the custom properties in the first :root block, by name.
function rootTokens(css: string): Map<string, string> {
  const block = css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
  const withoutComments = block.replace(/\/\*[\s\S]*?\*\//g, '');
  const tokens = new Map<string, string>();
  for (const [, name, value] of withoutComments.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens.set(name, value.trim().replace(/\s+/g, ' ').toLowerCase());
  }
  return tokens;
}

describe('og-image.html', () => {
  it('uses the same token values as src/index.css', () => {
    const ogTokens = rootTokens(read('./og-image.html'));
    const siteTokens = rootTokens(read('../src/index.css'));

    expect(ogTokens.size).toBeGreaterThan(0);
    for (const [name, value] of ogTokens) {
      expect({ name, value: siteTokens.get(name) }).toEqual({ name, value });
    }
  });
});
