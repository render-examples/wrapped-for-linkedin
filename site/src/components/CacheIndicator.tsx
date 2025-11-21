import React from 'react';
import { formatRelativeTime, formatFullDate } from '../utils/dateFormatter';
import '../styles/CacheIndicator.css';

interface CacheIndicatorProps {
  uploadDate: number;
  onClear?: () => void;
}

export const CacheIndicator: React.FC<CacheIndicatorProps> = ({ uploadDate, onClear }) => (
  <div className="cache-indicator">
    <div className="cache-indicator-content">
      <span className="cache-icon">💾</span>
      <div className="cache-text">
        <p className="cache-label">Loaded from cache</p>
        <p className="cache-time" title={formatFullDate(uploadDate)}>
          {formatRelativeTime(uploadDate)}
        </p>
      </div>
    </div>
    {onClear && (
      <button
        className="cache-clear-btn"
        onClick={onClear}
        title="Clear cache and upload new data"
        aria-label="Clear cached data"
      >
        ↻
      </button>
    )}
  </div>
);
