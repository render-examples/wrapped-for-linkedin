# Wrapped for LinkedIn

This is the frontend app for Wrapped for LinkedIn. It uses React, TypeScript, and Vite.

The app runs on [Render](https://render.com/).

## Quick Start

### Prerequisites

- Node.js 22.18 or later, with npm

### Development

From the repository root, run:

```bash
npm install --prefix site
bin/preview.sh
```

Open `http://localhost:5173`.

### Checks and Production Build

Run these commands in `site/`:

```bash
npm run lint
npm test
npm run build
npm run preview
```

`npm run preview` serves the production build from `dist/`.

## Tech Stack

- **React 19**: UI framework
- **TypeScript**: Type checking
- **Vite**: Build tool and dev server
- **Vitest**: Tests
- **SheetJS (xlsx)**: Excel file parsing
- **html-to-image and jsPDF**: PNG and PDF export
- **Render**: Hosting

## Live App

Visit [wrappedforlinkedin.onrender.com](https://wrappedforlinkedin.onrender.com/).
