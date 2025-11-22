import '../styles/Header.css';
import '../styles/CacheIndicator.css';

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
        <button
          className="linkedin-wrapped-title-container"
          onClick={handleHomeClick}
          aria-label="Navigate to home"
          title="LinkedIn Wrapped home"
        >
          <div className="logo-wrapper">
            <img
              src="/gift.png"
              alt="Gift decoration"
              className="gift-icon"
            />
            <h1 className="linkedin-wrapped-title">
              LinkedIn Wrapped
            </h1>
          </div>
        </button>
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
    </header>
  );
}
