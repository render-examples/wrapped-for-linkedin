# LinkedIn Wrapped architecture

This document describes how the LinkedIn Wrapped application is structured and how data flows through the system. The entire application runs client-side in the browser with no backend required.

**Tech Stack:** React 18 + TypeScript + Vite + Zustand + [Render](https://render.com/) (deployment)

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

## 📁 Directory structure

```
src/
├── components/          # React UI components
│   ├── WrappedStories/  # Shareable story cards (Instagram Stories-style)
│   ├── Header.tsx       # App header with navigation
│   ├── FileUpload.tsx   # File input interface
│   ├── UnifiedDashboard.tsx  # Main dashboard container
│   ├── SpotifyDashboard.tsx  # Summary metrics display
│   ├── TopPostsDisplay.tsx   # Top posts analytics
│   ├── DemographicsView.tsx  # Audience demographics
│   ├── FinalMessage.tsx      # End of wrapped message
│   ├── SampleDataButton.tsx  # Demo data loader
│   ├── Loading.tsx      # Loading state
│   ├── Error.tsx        # Error display
│   └── CacheIndicator.tsx # Cache status
├── hooks/               # Custom React hooks
│   └── useCache.ts      # Browser cache management
├── store/               # Zustand state store
│   └── index.ts         # Global app state
├── styles/              # CSS module files
│   ├── App.css
│   ├── Components*.css  # Component-specific styles
│   └── WrappedStories.css
├── types/               # TypeScript type definitions
│   ├── index.ts         # Main types
│   └── wrappedStories.ts # Card generation types
├── utils/               # Helper functions
│   ├── excel/           # Excel file parsing
│   │   ├── excelProcessor.ts     # Main orchestrator
│   │   ├── discoveryParser.ts    # Parse summary metrics
│   │   ├── topPostsParser.ts     # Parse top posts
│   │   ├── demographicsParser.ts # Parse audience data
│   │   ├── followersParser.ts    # Parse follower counts
│   │   ├── summaryMetricsParser.ts
│   │   └── types.ts              # Parser types
│   ├── api.ts           # Mock API helpers
│   ├── cardDataMapper.ts # Map data for story cards
│   ├── dateFormatter.ts # Date formatting helpers
│   ├── imageExport.ts   # Export cards as images
│   ├── linkedinShareLink.ts # Generate LinkedIn share URLs
│   ├── pdfExport.ts     # Export dashboard as PDF
│   ├── profileExtractor.ts # Extract profile info
│   ├── shareTextTemplates.ts # Share message templates
│   ├── storageManager.ts # Local storage wrapper
│   └── yearExtractor.ts # Extract year from data
├── App.tsx              # Root component
├── main.tsx             # Entry point
├── index.css            # Global styles
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
└── summaryMetricsParser → Engagement stats
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
├── Image → imageExport.ts → html2canvas library
└── LinkedIn → linkedinShareLink.ts → Pre-filled share URL
```

## 🎨 Key components

### **App.tsx** (Main app container)
- Root component that manages application state
- Handles file upload and demo data loading
- Routes between FileUpload and UnifiedDashboard views
- Manages error states and loading indicators
- Integrates with browser cache for data persistence

### **FileUpload.tsx** (Data input)
- Accepts Excel files via file input or drag-and-drop
- Includes demo data button for trying the app without uploading
- Validates file format
- Triggers processing pipeline
- Shows loading state during processing

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
- Rankings by impressions, engagement rate, comments
- Interactive sorting and filtering
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
- **DownloadInstructions.tsx**: Guide for saving cards
- **ExportProgress.tsx**: Real-time progress indicator for batch exports

### **WrappedStoriesContainer.tsx** (Wrapped Stories)
- Instagram Stories-inspired carousel with autoplay (5s per card by default)
- **Press-and-hold to pause**: Long-press on any card to pause autoplay (mobile)
- **Swipe/Tap navigation**: Tap left/right or swipe on mobile to navigate
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
   - Ranks by impressions/comments
   - Extracts post content preview

3. **demographicsParser.ts**
   - Parses follower demographics
   - Groups by industry, location, job title, seniority
   - Calculates percentage distributions
   - Filters and sorts for top items

4. **summaryMetricsParser.ts**
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

### **Zustand store** (`store/index.ts`)

Global state management with Zustand:

```typescript
interface AppState {
  // Data
  excelData: ParsedExcelData | null;
  analyticsData: AnalyticsData | null;

  // UI State
  loading: boolean;
  error: string | null;
  isShareDropdownOpen: boolean;
  isDownloading: boolean;

  // Metadata
  uploadDate: number | null;
  isFromCache: boolean;
  wrappedYear: number | null;

  // Actions
  setExcelData(data, uploadDate?, fromCache?): void;
  setLoading(loading): void;
  setError(error): void;
  // ... more setters
}
```

### **Cache hook** (`hooks/useCache.ts`)

Manages browser localStorage for caching:
- Stores parsed Excel data with timestamp
- Reuses data on return visits without re-uploading
- Shows cache indicator in header
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
- `imageExport.ts`: Convert components to PNG using html2canvas with batch optimization
- `pdfExport.ts`: Export dashboard as PDF with batch rendering for performance
- `batchImageExporter.ts`: Batch export multiple cards as images efficiently

### **Formatting**
- `dateFormatter.ts`: Format dates and times consistently
- `yearExtractor.ts`: Parse year from LinkedIn data format
- `shareTextTemplates.ts`: Pre-written share messages

### **Interaction**
- `linkedinShareLink.ts`: Generate LinkedIn share URLs with pre-filled text and wrapped link

### **Data processing**
- `profileExtractor.ts`: Extract user info from data
- `cardDataMapper.ts`: Transform data for card generation
- `api.ts`: Mock API for future backend integration

## 📝 Types & interfaces

### **Main types** (`types/index.ts`)

```typescript
// Data structures from Excel
EngagementMetrics {
  discovery_data: DiscoveryMetrics;
  top_posts: TopPost[];
  engagementByDay: DayEngagement[];
}

DemographicInsights {
  industries: DemographicItem[];
  locations: DemographicItem[];
  job_titles: DemographicItem[];
  seniority_levels: DemographicItem[];
  company_sizes: DemographicItem[];
}

TopPost {
  date: string;
  content: string;
  impressions: number;
  engagements: number;
  comments: number;
  reactions: number;
  shares: number;
  // ... more fields
}
```

### **Excel types** (`utils/excel/types.ts`)

```typescript
ParsedExcelData {
  discovery_data: DiscoveryMetrics;
  top_posts: TopPost[];
  demographics: DemographicInsights;
  engagement_by_day: DayEngagement[];
}
```

### **Story types** (`types/wrappedStories.ts`)

```typescript
ShareableCard {
  title: string;
  description: string;
  data: Record<string, any>;
  metadata: CardMetadata;
  index: number;
  // ... rendering data
}
```

## 🎨 Styling

### **Architecture**
- Global styles in `index.css` (CSS variables)
- Component-scoped CSS files in `styles/`
- Mobile-first responsive design with media queries
- Dark theme optimized for LinkedIn aesthetic

### **CSS variables**

```css
/* Colors */
--primary: #0A8FFF
--primary-light: #3FA9FF
--bg-primary: #0A0E27
--bg-secondary: #161B2F

/* Typography */
--font-display: "Segoe UI", Helvetica, Arial
--font-body: -apple-system, BlinkMacSystemFont, "Segoe UI"

/* Spacing */
Standard 2px, 4px, 8px, 16px, 32px grid
```

### **Responsive breakpoints**

```css
@media (max-width: 768px)  /* Tablets */
@media (max-width: 480px)  /* Mobile phones */
```

## 🚀 Development guide

### **Setup**
```bash
npm install
npm run dev  # Start Vite dev server with HMR
```

### **Building**
```bash
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### **Add a new feature**

1. **Add types** in `types/index.ts`
2. **Create component** in `components/`
3. **Add styles** in `styles/ComponentName.css`
4. **Integrate with store** if needed
5. **Add utility functions** in `utils/` if needed

### **Add a new Excel parser**

1. Create `utils/excel/newSheetParser.ts`
2. Import in `excelProcessor.ts`
3. Add to switch/case in processor
4. Update types in `utils/excel/types.ts`
5. Return data in `ParsedExcelData`

### **Common tasks**

**Update the dashboard layout:**
- Edit `UnifiedDashboard.tsx` component structure
- Adjust `styles/UnifiedDashboard.css`

**Add new share format:**
- Create utility in `utils/`
- Add button in `ShareButton.tsx`
- Integrate with export pipeline

**Modify data processing:**
- Edit relevant parser in `utils/excel/`
- Update types if schema changes
- Test with sample LinkedIn export

## 📚 Additional resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Vite Guide](https://vitejs.dev/)
- [XLSX Documentation](https://docs.sheetjs.com/)