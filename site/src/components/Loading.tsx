import React from 'react';
import '../styles/Loading.css';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = 'Loading your Wrapped for LinkedIn...' }) => {
  return (
    <div className="loading-container">
      <div className="loader">
        <div className="loader-spinner"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};
