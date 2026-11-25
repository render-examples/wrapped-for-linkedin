import { useState, useEffect } from 'react';
import { FileUpload } from '@components/FileUpload';
import { UnifiedDashboard } from '@components/UnifiedDashboard';
import { ErrorDisplay } from '@components/Error';
import { Header } from '@components/Header';
import { useCache } from '@/hooks/useCache';
import type { ParsedExcelData } from '@utils/excel/types';
import '@/App.css';

const SESSION_KEY = 'wrapped-session-active';

function App() {
  const [data, setData] = useState<ParsedExcelData | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  const handleDataLoaded = (parsed: ParsedExcelData) => {
    setData(parsed);
    setError(null);
    window.scrollTo(0, 0);
  };

  const resetState = () => {
    setData(null);
    setError(null);
    window.scrollTo(0, 0);
  };

  const handleClearCache = () => {
    clearCache();
    resetState();
  };

  const handleLogoClick = () => {
    // If the dashboard shows data, also clear the cache.
    if (data) {
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
      if (event.key === 'Escape' && data) {
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
  }, [data, clearCache]);

  return (
    <div className="app-container">
      <div className="landing-content">
        {data && <div className="background-overlay" />}

        <Header onLogoClick={handleLogoClick} />

        <main className="app-main">
          {data && (
            <button
              className="button secondary upload-new-data-btn"
              onClick={handleClearCache}
              aria-label="Upload new data"
              title="Upload new data"
            >
              Upload new data
            </button>
          )}

          {error && <ErrorDisplay error={error} onRetry={resetState} />}

          {!error && (data ? (
            <UnifiedDashboard data={data} onUploadNewData={handleClearCache} />
          ) : (
            <FileUpload onDataLoaded={handleDataLoaded} onError={setError} />
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
