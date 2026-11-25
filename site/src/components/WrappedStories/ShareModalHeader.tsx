import React from 'react';
import { Icon } from '@components/Icon';
import '@styles/WrappedStories.css';

interface ShareModalHeaderProps {
  title: string;
  closeLabel: string;
  onDismiss?: () => void;
}

/**
 * The title row of a share modal: a check mark, the title, and a close button.
 */
export const ShareModalHeader: React.FC<ShareModalHeaderProps> = ({ title, closeLabel, onDismiss }) => (
  <div className="instructions-header">
    <h3 className="instructions-title">
      <img src="/images/share/check.png" alt="Check" className="instructions-check-icon" />
      {title}
    </h3>
    <button className="instructions-close-btn" onClick={onDismiss} aria-label={closeLabel}>
      <span className="instructions-close-icon">
        <Icon name="close" />
      </span>
    </button>
  </div>
);
