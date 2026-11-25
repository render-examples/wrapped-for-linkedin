import React from 'react';
import '@styles/Header.css';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <button
            className="wrapped-for-linkedin-title-container"
            onClick={onLogoClick}
            aria-label="Navigate to home"
            title="Wrapped for LinkedIn home"
          >
            <span className="logo-wrapper">
              <img
                src="/images/title.svg"
                alt="Wrapped for LinkedIn"
                className="wrapped-for-linkedin-title-svg"
              />
            </span>
          </button>
        </div>
        <div className="header-right">
          <a
            href="https://dashboard.render.com/register?utm_source=2026_seasonal_wrapped"
            target="_blank"
            rel="noopener noreferrer"
            className="render-logo-link"
            aria-label="Sign up for Render"
          >
            <span className="render-powered-text" data-mobile-text="DEPLOYED ON">POWERED BY AND DEPLOYED ON</span>
            <img
              src="/images/render-logo.png"
              alt="Render"
              className="render-logo"
            />
          </a>
        </div>
      </div>
    </header>
  );
};
