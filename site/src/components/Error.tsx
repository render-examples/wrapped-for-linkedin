import React from 'react';
import { Icon } from '@components/Icon';
import '@styles/Error.css';

interface ErrorProps {
  error: string;
  onRetry?: () => void;
}

export const ErrorDisplay: React.FC<ErrorProps> = ({ error, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">
        <Icon name="warning" />
      </div>
      <h2>Oops! Something went wrong</h2>
      <p className="error-message">{error}</p>
      {onRetry && (
        <button className="button primary retry-button" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
};
