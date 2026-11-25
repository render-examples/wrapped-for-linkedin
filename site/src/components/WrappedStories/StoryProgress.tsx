import React from 'react';

interface StoryProgressProps {
  currentCardIndex: number;
  totalCards: number;
  onJumpToCard: (index: number) => void;
  isAutoPlaying: boolean;
  autoPlayDuration: number;
  isNavigatingBackward: boolean;
}

export const StoryProgress: React.FC<StoryProgressProps> = ({
  currentCardIndex,
  totalCards,
  onJumpToCard,
  isAutoPlaying,
  autoPlayDuration,
  isNavigatingBackward,
}) => {
  return (
    <div className="story-progress-container">
      <div className="progress-bars">
        {Array.from({ length: totalCards }).map((_, index) => (
          <div
            key={index}
            className={`progress-bar ${
              index === currentCardIndex
                ? 'active'
                : index < currentCardIndex
                  ? 'completed'
                  : ''
            }`}
            onClick={() => onJumpToCard(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                onJumpToCard(index);
              }
            }}
            aria-label={`Jump to card ${index + 1}`}
            style={{
              '--auto-play-duration': `${autoPlayDuration}ms`,
              '--is-autoplay': isAutoPlaying ? '1' : '0',
              '--is-backward': isNavigatingBackward ? '1' : '0',
            } as React.CSSProperties}
          >
            <div className="progress-fill" />
          </div>
        ))}
      </div>
    </div>
  );
};
