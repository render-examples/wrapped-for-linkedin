import '../styles/Header.css';

interface HeaderProps {
  onLogoClick?: () => void;
  onClearCache?: () => void;
  hasCachedData?: boolean;
}

export function Header({ onLogoClick, onClearCache, hasCachedData = false }: HeaderProps) {
  const handleHomeClick = () => {
    onLogoClick?.();
  };

  const handleClearCacheClick = () => {
    onClearCache?.();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="wrapped-on-linkedin-title-container"
            onClick={handleHomeClick}
            aria-label="Navigate to home"
            title="Wrapped for LinkedIn home"
          >
            <div className="logo-wrapper">
              <img
                src="/gift.png"
                alt="Gift decoration"
                className="gift-icon"
              />
              <h1 className="wrapped-on-linkedin-title">
                Wrapped for LinkedIn
              </h1>
            </div>
          </button>
          <div className="info-tooltip-wrapper">
            <span className="info-icon">ⓘ</span>
            <div className="tooltip-content">Not affiliated with LinkedIn or Microsoft</div>
          </div>
        </div>
        <div className="header-right">
          <a
            href="https://render.com"
            target="_blank"
            rel="noopener noreferrer"
            className="render-logo-link"
            aria-label="Visit Render.com"
          >
            <img
              src="/render-full-logo-white.png"
              alt="Render"
              className="render-logo"
            />
          </a>
          {hasCachedData && (
            <button
              className="cache-clear-btn"
              onClick={handleClearCacheClick}
              title="Clear cache and upload new data"
              aria-label="Clear cached data"
            >
              Upload new data
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
