import { useState } from 'react';
import '../styles/Header.css';

interface HeaderProps {
  onLogoClick?: () => void;
}

export function Header({ onLogoClick }: HeaderProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleHomeClick = () => {
    onLogoClick?.();
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <button
          className="linkedin-wrapped-title-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleHomeClick}
          aria-label="Navigate to home"
          title="LinkedIn Wrapped Home"
        >
          <div className="logo-wrapper">
            <h1 className={`linkedin-wrapped-title ${isHovered ? 'hovered' : ''}`}>
              LinkedIn Wrapped
            </h1>
            {/* Threading ribbon SVG overlay */}
            <svg
              className={`threading-ribbon ${isHovered ? 'visible' : ''}`}
              viewBox="0 0 300 50"
              xmlns="http://www.w3.org/2000/svg"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="ribbonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" style={{ stopColor: '#0A66C2', stopOpacity: 0 }} />
                  <stop offset="50%" style={{ stopColor: '#0A66C2', stopOpacity: 1 }} />
                  <stop offset="100%" style={{ stopColor: '#0A66C2', stopOpacity: 0 }} />
                </linearGradient>
              </defs>
              {/* Ribbon wrapping effect with tighter undulation */}
              <path
                className="ribbon-thread"
                d="M -10 20 Q 30 5 60 20 Q 90 35 120 20 Q 150 8 180 20 Q 210 32 240 20 Q 270 10 310 20"
                fill="none"
                stroke="url(#ribbonGradient)"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Secondary ribbon layer for depth */}
              <path
                className="ribbon-thread ribbon-thread-secondary"
                d="M -10 30 Q 30 42 60 30 Q 90 18 120 30 Q 150 40 180 30 Q 210 20 240 30 Q 270 38 310 30"
                fill="none"
                stroke="url(#ribbonGradient)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.6"
              />
            </svg>
          </div>
        </button>
      </div>
    </header>
  );
}
