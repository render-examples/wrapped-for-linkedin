# Wrapped for LinkedIn Architecture

This document describes how the site is structured and how data moves through it. The site parses the analytics file in the browser, and the file never leaves the browser. A separate screenshot service in `screenshot-service/` checks whether a top post is public and takes screenshots of public posts for exported cards. The site sends it only post URNs.

The site uses React 19, TypeScript, and Vite. It runs on [Render](https://render.com/).

## Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Data Flow](#data-flow)
- [Components](#components)
- [Excel Parsing](#excel-parsing)
- [State](#state)
- [Utilities](#utilities)
- [Styles](#styles)
- [Deployment](#deployment)

## Overview

- All data stays in the browser. There is no backend for analytics data.
- React components show the data. Parsers in `utils/excel/` read the file. Code in `exports/` makes PNG and PDF files.
- The site uses strict TypeScript.
- The story cards work like Instagram stories. They autoplay, pause when you press and hold, and change when you tap or swipe.

## Directory Structure

```
src/
├── components/          # React UI components
│   ├── WrappedStories/  # Story cards and sharing
│   │   ├── WrappedStoriesContainer.tsx # Carousel with autoplay and navigation
│   │   ├── StoryCard.tsx           # One story card
│   │   ├── StoryProgress.tsx       # Progress bars
│   │   ├── ShareButton.tsx         # Export and share menu
│   │   ├── NativeSharePrompt.tsx   # Phone share prompt
│   │   ├── DownloadInstructions.tsx # Desktop share steps
│   │   └── ShareModalHeader.tsx    # Header shared by the two share modals
│   ├── Header.tsx            # App header
│   ├── FileUpload.tsx        # File drop zone and upload steps
│   ├── UnifiedDashboard.tsx  # Dashboard container
│   ├── SpotifyDashboard.tsx  # Summary metrics
│   ├── BadgesSection.tsx     # Earned badges
│   ├── BadgeEmblem.tsx       # One badge emblem
│   ├── TopPostsDisplay.tsx   # Top posts
│   ├── DemographicsView.tsx  # Audience demographics
│   ├── FinalMessage.tsx      # Closing message
│   ├── SampleDataButton.tsx  # Demo data button
│   ├── Icon.tsx              # SVG icon set
│   └── Error.tsx             # Error display
├── exports/             # PNG and PDF export (see exports/README.md)
│   ├── imageExport.ts   # Export one card as PNG
│   ├── batchImageExporter.ts # Export many cards
│   ├── pdfExport.ts     # Export cards as PDF
│   ├── imageCache.ts    # Cache for exported images
│   └── postScreenshot.ts # Get post screenshots from the screenshot service
├── hooks/               # React hooks
│   ├── useCache.ts      # Load, save, and clear cached data
│   ├── usePostStatus.ts # Check whether a post is public
│   └── useSampleData.ts # Load the demo file
├── styles/              # Component styles
├── types/               # TypeScript types
│   ├── index.ts         # Shared types
│   └── wrappedStories.ts # Story card types
├── utils/               # Helper functions
│   ├── excel/           # Excel parsing, one parser per sheet
│   ├── badges.ts        # Badge rules
│   ├── bestMonthCalculator.ts # Find the best month
│   ├── cardDataMapper.ts # Map parsed data to story cards
│   ├── formatters.ts    # Number and date formatting
│   ├── linkedinEmbed.ts # Build LinkedIn embed URLs
│   ├── linkedinShareLink.ts # Build LinkedIn share URLs
│   ├── postStatus.ts    # Ask the screenshot service if a post is public
│   ├── screenshotService.ts # Client for the screenshot service
│   ├── storageManager.ts # localStorage wrapper
│   ├── storyTouch.ts    # Decide which taps change the story card
│   ├── venueComparison.ts # Compare reach to venue sizes
│   └── webShare.ts      # Share files through the system share sheet, or download them
├── App.tsx              # Root component
├── main.tsx             # Entry point
├── index.css            # Global styles and design tokens
├── App.css              # Page layout and footer styles
└── README.md            # This file
```

## Data Flow

### File Upload

```
User drops or selects an .xlsx file
        ↓
FileUpload calls processExcelFile(file)
        ↓
SheetJS reads the workbook
        ↓
One parser per sheet
├── parseDiscovery → Date range, impressions, members reached
├── parseFollowers → New followers
├── parseTopPosts → Top posts
├── parseDemographics → Audience demographics
└── parseEngagement → Impressions and engagements by day
        ↓
ParsedExcelData
        ↓
Saved to localStorage and passed to App
        ↓
App shows UnifiedDashboard
```

### Component Tree

```
App
├── Header
├── ErrorDisplay (when parsing fails)
├── FileUpload (before upload)
│   └── SampleDataButton
└── UnifiedDashboard (after upload)
    ├── WrappedStoriesContainer (story cards)
    ├── BadgesSection
    ├── SpotifyDashboard (summary metrics)
    ├── TopPostsDisplay
    ├── DemographicsView
    └── FinalMessage
```

### Export

```
User opens the share menu
    ↓
ShareButton exports the cards
├── PNG → imageExport.ts → html-to-image
├── PDF → pdfExport.ts → jsPDF
├── Phone → webShare.ts → system share sheet → LinkedIn app
└── Desktop → download → linkedinShareLink.ts → pre-filled share URL
```

## Components

### App.tsx

- Holds the parsed data and the error message in state.
- Shows `FileUpload` when there is no data, and `UnifiedDashboard` when there is.
- Clears the cache when a new tab opens.
- The logo, the Escape key, and Ctrl+Shift+R (Cmd+Shift+R on a Mac) return to the home page and clear the cache.

### FileUpload.tsx

- Accepts `.xlsx` files by drop or file picker.
- Shows the demo data button and the export steps.
- Loads cached data on mount, and saves uploaded data to the cache.

### UnifiedDashboard.tsx

- Builds the story cards and the earned badges from the parsed data.
- Shows each section only when its data exists.

### SpotifyDashboard.tsx

Shows total impressions, members reached, new followers, total engagements, best month, and median daily impressions.

### TopPostsDisplay.tsx

Shows the top posts in the order of the export, which ranks them by engagements. Public posts show a LinkedIn embed.

### DemographicsView.tsx

Shows job titles, locations, industries, seniority levels, company sizes, and companies, each with percentage bars.

### WrappedStories/

- `WrappedStoriesContainer.tsx` shows one card at a time. Cards autoplay every 5 seconds by default and loop back to the start.
- Press and hold a card to pause. Tap the left or right side, or swipe, to change cards. Taps on buttons, links, progress bars, and menus do not change the card.
- The arrow keys change cards.
- `StoryCard.tsx` renders one card.
- `StoryProgress.tsx` shows the progress bars.
- `ShareButton.tsx` exports cards as PNG or PDF and opens the share flow.
- `NativeSharePrompt.tsx` opens the system share sheet on phones.
- `DownloadInstructions.tsx` shows the steps to attach a downloaded card on desktop, or when sharing fails.

## Excel Parsing

`processExcelFile(file)` in `utils/excel/excelProcessor.ts` reads the file into an `ArrayBuffer`, parses it with SheetJS, and calls one parser per sheet. Every sheet is optional.

| Parser | Sheet | Result |
| --- | --- | --- |
| `discoveryParser.ts` | Discovery | Date range, total impressions, members reached, and average impressions per day |
| `followersParser.ts` | Followers | Sum of new followers |
| `topPostsParser.ts` | Top posts | Posts in export order, which ranks them by engagements |
| `demographicsParser.ts` | Demographics | Items grouped by category and sorted by percentage |
| `engagementParser.ts` | Engagement | Impressions and engagements by day, total engagements, and median daily impressions |

`generateShareableCards(data)` in `utils/cardDataMapper.ts` turns `ParsedExcelData` into the list of story cards.

## State

`App.tsx` holds the state with `useState` and passes it to child components as props:

```typescript
const [data, setData] = useState<ParsedExcelData | null>(null);
const [error, setError] = useState<string | null>(null);
```

`hooks/useCache.ts` stores the parsed data in localStorage with an upload timestamp. A reload in the same tab loads the data again. A new tab clears it.

`hooks/useSampleData.ts` loads the demo file from `public/demo-data/`.

## Utilities

- `storageManager.ts` wraps localStorage.
- `formatters.ts` formats numbers and dates.
- `venueComparison.ts` compares reach to the capacity of a known venue.
- `linkedinShareLink.ts` builds LinkedIn share URLs with pre-filled text.
- `webShare.ts` shares files through the system share sheet, or downloads them.
- `badges.ts` decides which badges the user earned.
- `bestMonthCalculator.ts` finds the month with the most engagement.
- `screenshotService.ts` is the client for the screenshot service. It sends only post URNs.
- `postStatus.ts` asks whether a post is public.
- `exports/postScreenshot.ts` gets a post screenshot for export. See `exports/README.md`.

## Styles

Most components have one CSS file in `styles/`. `SectionTitles.css` and `SectionSubtitles.css` hold the section header styles that several components share. `fonts.css` loads the fonts. `index.css` defines the color and font tokens, base element styles, the shared `.button` and `.section-eyebrow` styles, and the shared keyframes.

## Deployment

`render.yaml` at the repository root defines the static site and the screenshot service. For the site, Render runs `npm install` and `npm run build` in `site/`, then serves `site/dist/`. All paths rewrite to `index.html`. `VITE_SCREENSHOT_SERVICE_URL` gives the public URL of the screenshot service at build time.

## Resources

- [Render docs](https://render.com/docs)
- [React docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite docs](https://vite.dev/)
- [SheetJS docs](https://docs.sheetjs.com/)
