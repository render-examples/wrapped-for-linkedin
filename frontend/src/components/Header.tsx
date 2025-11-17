import { useState } from 'react';
import '../styles/Header.css';

export function Header() {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <header className="app-header">
      <div className="header-content">
        <div
          className="linkedin-wrapped-title-container"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <h1 className={`linkedin-wrapped-title ${isHovered ? 'hovered' : ''}`}>
            LinkedIn Wrapped
          </h1>
          {isHovered && (
            <svg
              className="ribbon-bow"
              viewBox="0 0 200 100"
              xmlns="http://www.w3.org/2000/svg"
              width="80"
              height="40"
            >
              <g className="ribbon-group">
                {/* Left ribbon tail */}
                <path
                  className="ribbon-path"
                  d="M 20 50 Q 30 40 40 50 Q 35 60 25 55"
                  fill="none"
                  stroke="#0A66C2"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Right ribbon tail */}
                <path
                  className="ribbon-path"
                  d="M 180 50 Q 170 40 160 50 Q 165 60 175 55"
                  fill="none"
                  stroke="#0A66C2"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                {/* Center bow */}
                <circle
                  className="bow-center"
                  cx="100"
                  cy="50"
                  r="8"
                  fill="#0A66C2"
                />
              </g>
            </svg>
          )}
        </div>
      </div>
    </header>
  );
}
