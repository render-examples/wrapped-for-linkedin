import React from 'react';
import type { ExportProgress as ExportProgressType } from '../../types/export';
import '../../styles/ExportProgress.css';

interface ExportProgressProps {
  progress: ExportProgressType;
  isVisible: boolean;
  onCancel?: () => void;
}

/**
 * ExportProgress: Display progress of export operations
 * Shows current card, overall progress, stage, and estimated time
 */
export const ExportProgress: React.FC<ExportProgressProps> = ({
  progress,
  isVisible,
  onCancel,
}) => {
  if (!isVisible) return null;

  const stageMessages = {
    rendering: 'Rendering cards...',
    assembling: 'Assembling PDF...',
    finalizing: 'Finalizing file...',
  };

  const estimatedSeconds = progress.estimatedTimeRemaining
    ? (progress.estimatedTimeRemaining / 1000).toFixed(0)
    : '...';

  return (
    <div className="export-progress-overlay">
      <div className="export-progress-modal">
        <div className="export-progress-header">
          <h3>Exporting LinkedIn Wrapped</h3>
          <p className="export-stage">{stageMessages[progress.stage]}</p>
        </div>

        <div className="export-progress-body">
          <div className="export-progress-content">
            <div className="progress-bar-container">
              <div
                className="progress-bar-fill"
                style={{ width: `${progress.percentComplete}%` }}
              />
            </div>

            <div className="progress-info">
              <div className="progress-stats">
                <span className="stat-label">Cards:</span>
                <span className="stat-value">
                  {progress.current} / {progress.total}
                </span>
              </div>

              <div className="progress-stats">
                <span className="stat-label">Progress:</span>
                <span className="stat-value">{progress.percentComplete}%</span>
              </div>

              {progress.estimatedTimeRemaining && (
                <div className="progress-stats">
                  <span className="stat-label">Estimated time:</span>
                  <span className="stat-value">~{estimatedSeconds}s</span>
                </div>
              )}
            </div>

            <div className="progress-details">
              <div className="spinner" />
              <p className="progress-message">
                Processing card {progress.current} of {progress.total}...
              </p>
            </div>
          </div>
        </div>

        {onCancel && (
          <div className="export-progress-footer">
            <button className="btn-cancel" onClick={onCancel}>
              Cancel export
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
