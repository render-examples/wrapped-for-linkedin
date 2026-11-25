import { useState, useEffect } from 'react';
import { FileUpload } from '@components/FileUpload';
import { UnifiedDashboard } from '@components/UnifiedDashboard';
import { Loading } from '@components/Loading';
import { Error as ErrorDisplay } from '@components/Error';
import { Header } from '@components/Header';
import { useCache } from '@/hooks/useCache';
import type { DemographicInsights, EngagementMetrics } from '@types';
import type { ParsedExcelData } from '@utils/excel/types';
import '@/App.css';

interface DataState {
  engagement: EngagementMetrics | null;
  demographics: DemographicInsights | undefined;
  uploadDate: number | null;
  isFromCache: boolean;
  error: string | null;
}

const INITIAL_STATE: DataState = {
  engagement: null,
  demographics: undefined,
  uploadDate: null,
  isFromCache: false,
  error: null,
};

const SESSION_KEY = 'wrapped-session-active';

function App() {
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<DataState>(INITIAL_STATE);
  const { clear: clearCache } = useCache();

  // Clear the cache when the tab has no session flag.
  // sessionStorage lasts for the life of the tab, so this happens once per new tab.
  useEffect(() => {
    const wasSessionActive = sessionStorage.getItem(SESSION_KEY);

    if (!wasSessionActive) {
      clearCache();
      sessionStorage.setItem(SESSION_KEY, 'true');
    }

    const handleBeforeUnload = () => {
      sessionStorage.setItem(SESSION_KEY, 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [clearCache]);

  const handleFileProcessed = (excelData: ParsedExcelData, fileError?: string, date?: number, fromCache?: boolean) => {
    setLoading(false);

    if (fileError) {
      setState(prev => ({ ...prev, error: fileError }));
      return;
    }

    setState({
      engagement: {
        discovery_data: excelData.discovery_data,
        top_posts: excelData.top_posts,
        engagementByDay: excelData.engagement_by_day,
      },
      demographics: excelData.demographics,
      uploadDate: date ?? Date.now(),
      isFromCache: fromCache ?? false,
      error: null,
    });
  };

  const resetState = () => {
    setState(INITIAL_STATE);
  };

  const handleClearCache = () => {
    clearCache();
    resetState();
  };

  const handleLogoClick = () => {
    // If the dashboard shows data, also clear the cache.
    if (state.engagement) {
      handleClearCache();
    } else {
      resetState();
    }
  };

  const currentYear = new Date().getFullYear();

  // Keyboard shortcuts that return to the home page.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape returns to the home page.
      if (event.key === 'Escape' && state.engagement) {
        handleClearCache();
        return;
      }

      // Ctrl+Shift+R or Cmd+Shift+R stops the hard refresh and returns to the home page.
      if (
        event.key === 'R' &&
        event.shiftKey &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        clearCache();
        resetState();
        sessionStorage.clear();
        sessionStorage.setItem(SESSION_KEY, 'true');
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.engagement, clearCache]);

  return (
    <div className="app-container">
      <div className="landing-content">
        {state.engagement && <div className="background-overlay" />}

        <Header onLogoClick={handleLogoClick} />

        <main className="app-main">
          {state.engagement && (
            <button
              className="button secondary upload-new-data-btn"
              onClick={handleClearCache}
              aria-label="Upload new data"
              title="Upload new data"
            >
              Upload new data
            </button>
          )}

          {state.error && <ErrorDisplay error={state.error} onRetry={resetState} />}

          {loading && <Loading />}

          {!loading && !state.error && (state.engagement ? (
            <UnifiedDashboard
              data={state.engagement}
              demographics={state.demographics}
              onUploadNewData={handleClearCache}
            />
          ) : (
            <FileUpload onFileProcessed={handleFileProcessed} isLoading={loading} />
          ))}
        </main>
      </div>

      <footer className="app-footer">
        <div className="footer-disclaimer-row">
          <p className="footer-disclaimer">
            This site is not affiliated with LinkedIn or Microsoft.
          </p>
        </div>
        <div className="footer-bottom-row">
          <p className="footer-links">
            <a
              href="https://x.com/render"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              X
            </a>
            &nbsp; &nbsp; &nbsp; &nbsp;
            <a
              href="https://x.com/render"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              LinkedIn
            </a>
            &nbsp; &nbsp; &nbsp; &nbsp;
            <a
              href="https://github.com/render-examples/wrapped-for-linkedin"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
          </p>
          <p className="footer-copyright">
            © Render {currentYear}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
