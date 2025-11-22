import React, { useRef } from 'react';
import { ShareButton } from './ShareButton';
import type { ShareableCard } from '../../types/wrappedStories';

interface StoryCardProps {
  card: ShareableCard;
  isActive: boolean;
  cardIndex: number;
  onNext: () => void;
  onPrevious: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  card,
  isActive,
  cardIndex,
  onNext,
  onPrevious,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const clickZoneWidth = 30; // percentage of screen width for click zones

  const handleLeftClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const threshold = (rect.width * clickZoneWidth) / 100;

    if (clickX < threshold) {
      onPrevious();
    }
  };

  const handleRightClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const threshold = (rect.width * (100 - clickZoneWidth)) / 100;

    if (clickX > threshold) {
      onNext();
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Check left zone
    handleLeftClick(e);
    // Check right zone
    handleRightClick(e);
  };

  return (
    <div
      ref={cardRef}
      className={`story-card ${card.type} ${isActive ? 'active' : ''}`}
      style={{
        '--card-gradient': card.gradient,
        '--card-bg-color': card.backgroundColor,
      } as React.CSSProperties & { [key: string]: string }}
      onClick={handleCardClick}
      role="region"
      aria-label={`Card ${cardIndex + 1}: ${card.title}`}
    >
      {/* Card Content */}
      <div className="card-content-wrapper">
        <div className="card-header">
          <h2 className="card-title">{card.title}</h2>
        </div>

        <div className="card-body">
          <span className="card-icon">{card.data.icon}</span>

          {card.type === 'year-summary' ? (
            // Summary card with multiple metrics
            <div className="summary-metrics">
              <div className="metric-row">
                <div className="metric">
                  <div className="metric-value">{card.data.impressions}</div>
                  <div className="metric-label">Total impressions</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{card.data.membersReached}</div>
                  <div className="metric-label">Members reached</div>
                </div>
              </div>
              <div className="metric-row">
                <div className="metric">
                  <div className="metric-value">{card.data.engagements}</div>
                  <div className="metric-label">Total engagements</div>
                </div>
                <div className="metric">
                  <div className="metric-value">{card.data.newFollowers}</div>
                  <div className="metric-label">New followers</div>
                </div>
              </div>
            </div>
          ) : card.type === 'top-post' ? (
            // Top post card with engagement details
            <div className="top-post-content">
              <div className="post-engagements">
                <div className="engagement-stat">
                  <span className="engagement-icon">❤️</span>
                  <span className="engagement-value">{card.data.value}</span>
                </div>
              </div>
              {card.data.label && (
                <div className="card-label">{card.data.label}</div>
              )}
              {card.data.date && (
                <div className="post-date">
                  Published: {new Date(card.data.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
              )}
              {card.data.context && (
                <div className="card-context">{card.data.context}</div>
              )}
            </div>
          ) : (
            <>
              {card.data.value && (
                <div className="card-value">{card.data.value}</div>
              )}

              {card.data.label && (
                <div className="card-label">{card.data.label}</div>
              )}

              {card.data.context && (
                <div className="card-context">{card.data.context}</div>
              )}
            </>
          )}
        </div>

        <div className="card-footer">
          <div className="branding">LinkedIn Wrapped 2025</div>
          <ShareButton
            cardId={card.id}
            shareText={card.shareText}
            cardRef={cardRef as React.RefObject<HTMLDivElement>}
          />
        </div>
      </div>

      {/* Click Zone Indicators (hidden in production) */}
      <div className="click-zones" aria-hidden="true">
        <div className="click-zone left-zone" title="Click to go previous"></div>
        <div className="click-zone right-zone" title="Click to go next"></div>
      </div>
    </div>
  );
};
