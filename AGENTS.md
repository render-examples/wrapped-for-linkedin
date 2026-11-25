# AGENTS.md

Wrapped for LinkedIn turns a LinkedIn analytics Excel export into year-in-review story cards. See `README.md` for features and setup.

## Layout

- `site/` is the React 19, TypeScript, and Vite app. It deploys as a Render static site.
- `screenshot-service/` is an Express service. It uses Playwright and Chromium to take screenshots of public LinkedIn post embeds for exported cards. It deploys as a Render Docker web service.
- `render.yaml` defines both services.

The root `package.json` is not used for development. Run npm commands in `site/` or `screenshot-service/`.

## Commands

Run these before you commit:

```bash
cd site && npm run lint && npm test && npm run build
cd screenshot-service && npm test
```

Start the site with `bin/preview.sh`. Start the screenshot service with `ALLOWED_ORIGIN=http://localhost:5173 npm start` in `screenshot-service/`.

After you change `site/og/og-image.html`, run `npm run og` in `site/` and commit the new `site/public/images/og-image.png`.

`site/fixtures/all-badges.xlsx` is a mock export that earns every badge. After you change a badge rule or the export format, run `npm run fixtures` in `site/` and commit the new file.

## Site conventions

- Import with the path aliases in `site/tsconfig.app.json`, such as `@components`, `@utils`, and `@exports`.
- Put Excel parsing in `site/src/utils/excel/`. Each sheet has its own parser.
- Put styles in `site/src/styles/`, one CSS file per component. Use the shared tokens in `site/src/index.css` for colors and fonts.
- Put tests next to the file they test, as `*.test.ts`. The site uses Vitest.
- `site/src/README.md` describes the architecture. `site/src/exports/README.md` describes the PNG and PDF export system. Update them when you change that code.

## Privacy

The analytics file must stay in the browser. Do not send file contents to any server.

The site may send only post URNs to the screenshot service. The service must log only status codes. Do not log post URLs, URNs, IP addresses, or headers.

## Screenshot service conventions

- The service is TypeScript. Node runs the `.ts` files directly by removing the types, so there is no build step. `npm test` runs `tsc` to check types, then the Node.js test runner.
- Node cannot run TypeScript syntax that generates code, such as `enum`, `namespace`, and constructor parameter properties. `erasableSyntaxOnly` in `tsconfig.json` rejects them. Import local files with the `.ts` extension.
- `src/app.ts` builds the Express app with injected dependencies, so tests run without Chromium. Keep Playwright calls in `src/linkedin.ts`.
- Keep the Playwright version in `package.json` the same as the image tag in `Dockerfile`.
- If you change a service URL, update `VITE_SCREENSHOT_SERVICE_URL` and `ALLOWED_ORIGIN` in `render.yaml`.

## Writing

Use Conventional Commits, such as `feat:`, `fix:`, and `style:`. Write commit messages, comments, and docs in plain English with short sentences.
