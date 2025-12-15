import React from 'react';
import '@styles/Error.css';

interface ErrorProps {
  error: string;
  onRetry?: () => void;
}

export const Error: React.FC<ErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">⚠️</div>
      <h2>Oops! Something went wrong</h2>
      <p className="error-message">{error}</p>
      {onRetry && (
        <button className="retry-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
};
