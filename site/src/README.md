# Wrapped for LinkedIn architecture

This document describes how the Wrapped for LinkedIn application is structured and how data flows through the system. The analytics file is parsed in the browser and never leaves it. A separate screenshot service (`screenshot-service/`) takes screenshots of public LinkedIn posts for exported cards. The site sends it only public post URNs.

The app is powered by and deployed on [Render](https://render.com/).

**Tech Stack:** React 19 + TypeScript + Vite

## 📋 Table of contents

- [Architecture overview](#architecture-overview)
- [Directory structure](#directory-structure)
- [Data flow](#data-flow)
- [Key components](#key-components)
- [Data processing pipeline](#data-processing-pipeline)
- [State management](#state-management)
- [Utilities & helpers](#utilities--helpers)
- [Types & interfaces](#types--interfaces)
- [Styling](#styling)
- [Development guide](#development-guide)

## 🏗️ Architecture overview

The application follows a **component-driven architecture** with:
- **Separation of concerns**: UI components, data processing, state management
- **Type safety**: Full TypeScript with strict mode
- **Client-side only**: All data stays in the user's browser
- **Responsive design**: Mobile-friendly with CSS media queries
- **Instagram-inspired UX**: Autoplay carousel with pause, swipe navigation, and keyboard controls
- **Render deployment**: Hosted on [Render](https://render.com/) for reliable, fast global delivery

## 📁 Directory structure

```
src/
├── components/          # React UI components
│   ├── WrappedStories/  # Shareable story cards (Instagram Stories-style)
│   │   ├── WrappedStoriesContainer.tsx # Carousel with autoplay and navigation
│   │   ├── StoryCard.tsx           # One story card
│   │   ├── StoryProgress.tsx       # Progress bars
│   │   ├── ShareButton.tsx         # Export and share menu
│   │   ├── NativeSharePrompt.tsx   # Phone share prompt
│   │   ├── DownloadInstructions.tsx # Desktop share steps
│   │   └── ShareModalHeader.tsx    # Header shared by the two share modals
│   ├── Header.tsx       # App header with navigation
│   ├── FileUpload.tsx   # File input interface
│   ├── UnifiedDashboard.tsx  # Main dashboard container
│   ├── SpotifyDashboard.tsx  # Summary metrics display
│   ├── BadgesSection.tsx     # Earned badges
│   ├── BadgeEmblem.tsx       # One badge emblem
│   ├── TopPostsDisplay.tsx   # Top posts analytics
│   ├── DemographicsView.tsx  # Audience demographics
│   ├── FinalMessage.tsx      # End of wrapped message
│   ├── SampleDataButton.tsx  # Demo data loader
│   ├── Icon.tsx         # SVG icon set
│   └── Error.tsx        # Error display
├── exports/             # PNG and PDF export (see exports/README.md)
│   ├── imageExport.ts   # Export one card as PNG
│   ├── batchImageExporter.ts # Export many cards
│   ├── pdfExport.ts     # Export cards as PDF
│   ├── imageCache.ts    # LRU cache for exported images
│   └── postScreenshot.ts # Get post screenshots from the screenshot service
├── hooks/               # Custom React hooks
│   ├── useCache.ts      # Browser cache management
│   ├── usePostStatus.ts # Check whether a post is public
│   └── useSampleData.ts # Demo data functionality
├── styles/              # One CSS file per component
├── types/               # TypeScript type definitions
│   ├── index.ts         # Main types
│   └── wrappedStories.ts # Card generation types
├── utils/               # Helper functions
│   ├── excel/           # Excel file parsing, one parser per sheet
│   ├── badges.ts        # Badge rules
│   ├── bestMonthCalculator.ts # Find the best month
│   ├── cardDataMapper.ts # Map data for story cards
│   ├── formatters.ts    # Number and date formatting
│   ├── linkedinEmbed.ts # Build LinkedIn embed URLs
│   ├── linkedinShareLink.ts # Generate LinkedIn share URLs
│   ├── postStatus.ts    # Ask the screenshot service if a post is public
│   ├── screenshotService.ts # Client for the screenshot service
│   ├── storageManager.ts # Local storage wrapper
│   ├── storyTouch.ts    # Decide which taps change the story card
│   ├── venueComparison.ts # Compare reach to venue sizes
│   └── webShare.ts      # Share files through the system share sheet, or download them
├── App.tsx              # Root component
├── main.tsx             # Entry point
├── index.css            # Global styles and color tokens
└── README.md            # This file
```

## 🔄 Data flow

### 1. **File upload flow**

```
User selects Excel file
        ↓
FileUpload component triggers
        ↓
excelProcessor.processFile()
        ↓
XLSX library reads file
        ↓
Route to specific parsers
├── discoveryParser → Summary metrics
├── topPostsParser → Top posts data
├── demographicsParser → Audience info
├── followersParser → Follower counts
└── engagementParser → Engagement stats
        ↓
Aggregate into ParsedExcelData
        ↓
Store in local storage + state
        ↓
Render UnifiedDashboard
```

### 2. **Component render flow**

```
App.tsx (root)
    ↓
Header (navigation + cache management)
    ↓
UnifiedDashboard (main container)
    ├── WrappedStoriesContainer (shareable cards)
    ├── SpotifyDashboard (summary stats)
    ├── TopPostsDisplay (engagement rankings)
    └── DemographicsView (audience insights)
```

### 3. **Export flow**

```
User clicks Share/Export
    ↓
cardDataMapper transforms data
    ↓
Choose export format:
├── PDF → pdfExport.ts → jsPDF library
├── Image → imageExport.ts → html-to-image library
├── Phone → webShare.ts → system share sheet → LinkedIn app
└── Desktop → download → linkedinShareLink.ts → Pre-filled share URL
```

## 🎨 Key components

### **App.tsx** (Main app container)
- Root component that manages application state
- Handles file upload and demo data loading
- Routes between FileUpload and UnifiedDashboard views
- Manages error states
- Integrates with browser cache for data persistence

### **FileUpload.tsx** (Data input)
- Accepts Excel files via file input or drag-and-drop
- Includes demo data button for trying the app without uploading
- Validates file format
- Triggers processing pipeline

### **UnifiedDashboard.tsx** (Main view)
- Container component for all dashboard sections
- Conditionally renders sub-components based on data availability
- Orchestrates data aggregation for exports

### **SpotifyDashboard.tsx** (Summary card)
- Spotify Wrapped-style summary card
- Displays key metrics (views, engagements, impressions)
- Shows wrapped year from extracted date
- Animated statistics with formatting

### **TopPostsDisplay.tsx** (Post analytics)
- Ranked by engagements, in the order of the export
- Individual post statistics and preview

### **DemographicsView.tsx** (Audience insights)
- Top industries, locations, job titles
- Seniority level distribution
- Company size analysis
- Visual percentage bars

### **WrappedStories/** (Shareable cards)
- **WrappedStoriesContainer.tsx**: Main container with Instagram Stories-style carousel including autoplay, pause-on-hold, and keyboard/swipe navigation
- **StoryCard.tsx**: Individual story card component with responsive design
- **StoryProgress.tsx**: Progress indicators and card navigation
- **ShareButton.tsx**: Export cards as images/PDFs and pre-filled LinkedIn share functionality
- **NativeSharePrompt.tsx**: Share prompt on phones. Opens the system share sheet with the exported file.
- **DownloadInstructions.tsx**: Steps to attach a downloaded card on desktop, or when sharing fails.

### **WrappedStoriesContainer.tsx** (Wrapped Stories)
- Instagram Stories-inspired carousel with autoplay (5s per card by default)
- **Press-and-hold to pause**: Long-press on any card to pause autoplay (mobile)
- **Swipe/Tap navigation**: Tap left/right or swipe on mobile to navigate
- Taps on buttons, links, progress bars, and menus do not change the card
- **Keyboard controls**: Arrow keys to navigate, Escape to pause autoplay
- **Progress indicators**: Visual progress bars at top of each card
- Cycles through cards with wrapping (loops back to start)

## 🔧 Data processing pipeline

### **Excel processing** (`utils/excel/`)

The excel processor is the gateway for converting raw Excel exports to structured data:

```
excelProcessor.processFile(file)
    ↓
Read file with FileReader API
    ↓
Parse with XLSX.read()
    ↓
Extract sheet names
    ↓
For each sheet, delegate to specific parser:
```

**Parsers by sheet type:**

1. **discoveryParser.ts**
   - Extracts summary metrics (views, engagements, impressions)
   - Calculates engagement rate
   - Identifies peak engagement times
   - Formats engagement by day/time

2. **topPostsParser.ts**
   - Processes post-level data
   - Calculates post metrics and engagement
   - Keeps the export order, which ranks posts by engagements
   - Extracts post content preview

3. **demographicsParser.ts**
   - Parses follower demographics
   - Groups by industry, location, job title, seniority
   - Calculates percentage distributions
   - Filters and sorts for top items

4. **engagementParser.ts**
   - Aggregates engagement totals
   - Calculates median daily impressions
   - Derives peak engagement time
   - Generates engagement stats

5. **followersParser.ts**
   - Extracts total follower counts
   - Tracks follower growth
   - Calculates growth metrics

### **Data aggregation** (`cardDataMapper.ts`)

Maps parsed Excel data into the specific format needed for story card generation:

```typescript
generateShareableCards(excelData)
    ├── Extract top posts
    ├── Extract demographics
    ├── Calculate engagement metrics
    ├── Format for each card type
    └── Return array of card data
```

## 🎯 State management

### **React State** (`App.tsx`)

The app uses React's built-in `useState` hook for state management:

```typescript
// In App.tsx
const [data, setData] = useState<ParsedExcelData | null>(null);
const [error, setError] = useState<string | null>(null);
```

State is managed at the root `App` component level and passed down to child components via props.

### **Cache hook** (`hooks/useCache.ts`)

Manages browser localStorage for caching:
- Stores parsed Excel data with timestamp
- Reuses data on return visits without re-uploading
- Shows cache indicator
- Allows manual cache clearing
- Improves user experience for returning visitors

### **Sample data hook** (`hooks/useSampleData.ts`)

Manages demo data functionality:
- Provides sample analytics data for testing
- Loads demo data on button click
- Allows users to explore features without uploading

## 🛠️ Utilities & helpers

### **File I/O**
- `storageManager.ts`: Wrapper for localStorage API
- `exports/`: PNG and PDF export. See `exports/README.md`.

### **Formatting**
- `formatters.ts`: Format numbers and dates
- `venueComparison.ts`: Compare reach to the capacity of a known venue

### **Interaction**
- `linkedinShareLink.ts`: Generate LinkedIn share URLs with pre-filled text and wrapped link
- `webShare.ts`: Share files through the system share sheet, or download them

### **Data processing**
- `cardDataMapper.ts`: Transform data for card generation
- `badges.ts`: Decide which badges the user earned
- `bestMonthCalculator.ts`: Find the month with the most engagement

### **Screenshot service**
- `screenshotService.ts`: Client for the service. It sends only post URNs.
- `postStatus.ts`: Ask whether a post is public
- `exports/postScreenshot.ts`: Get a post screenshot for export

### **Deployment**

The app is automatically deployed to [Render](https://render.com/) when changes are pushed to the main branch. Render:
- Builds the app using `npm run build`
- Serves the static files from the `dist/` directory
- Provides automatic SSL certificates
- Offers global CDN distribution for fast loading times

## 📚 Additional resources
- [Render website](https://render.com)
- [Render docs](https://render.com/docs) 
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/)
- [XLSX Documentation](https://docs.sheetjs.com/)