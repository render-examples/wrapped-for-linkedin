import { useCallback, useState } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { FileUpload } from '@components/FileUpload';
import { UnifiedDashboard } from '@components/UnifiedDashboard';
import { ErrorDisplay } from '@components/ErrorDisplay';
import { Header } from '@components/Header';
import { useCache } from '@/hooks/useCache';
import { useShortcutKeys } from '@/hooks/useShortcutKeys';
import type { ParsedExcelData } from '@utils/excel/types';
import '@/App.css';

function App() {
  const [data, setData] = useState<ParsedExcelData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { clear: clearCache } = useCache();

  const handleDataLoaded = (parsed: ParsedExcelData) => {
    setData(parsed);
    setError(null);
    window.scrollTo(0, 0);
  };

  const resetState = useCallback(() => {
    setData(null);
    setError(null);
    window.scrollTo(0, 0);
  }, []);

  const handleClearCache = useCallback(() => {
    clearCache();
    resetState();
  }, [clearCache, resetState]);

  const handleLogoClick = () => {
    // If the dashboard shows data, also clear the cache.
    if (data) {
      handleClearCache();
    } else {
      resetState();
    }
  };

  const currentYear = new Date().getFullYear();

  // Escape returns to the home page. It does nothing while a modal or menu has the key.
  useShortcutKeys((event) => {
    if (event.key === 'Escape' && data) {
      handleClearCache();
    }
  });

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
              title="Upload new data"
            >
              Upload new data
            </button>
          )}

          {error && <ErrorDisplay error={error} onRetry={resetState} />}

          {!error && (
            // Cached data can cause a render error, so Try again also clears the cache.
            <ErrorBoundary
              fallbackRender={({ resetErrorBoundary }) => (
                <ErrorDisplay
                  error="The app could not show this data. Upload your file again."
                  onRetry={resetErrorBoundary}
                />
              )}
              onReset={handleClearCache}
              onError={(renderError) => console.error('Render error:', renderError)}
              resetKeys={[data]}
            >
              {data ? (
                <UnifiedDashboard data={data} onUploadNewData={handleClearCache} />
              ) : (
                <FileUpload onDataLoaded={handleDataLoaded} onError={setError} />
              )}
            </ErrorBoundary>
          )}
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
            <a
              href="https://www.linkedin.com/company/renderco"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              LinkedIn
            </a>
            <a
              href="https://github.com/render-examples/wrapped-for-linkedin"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              GitHub
            </a>
          </p>
          <p className="footer-copyright">© Render {currentYear}</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
