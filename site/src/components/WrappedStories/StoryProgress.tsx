import React from 'react';

interface StoryProgressProps {
  currentCardIndex: number;
  totalCards: number;
  onJumpToCard: (index: number) => void;
  isAutoPlaying: boolean;
  autoPlayDuration: number;
  isNavigatingBackward: boolean;
}

/**
 * One bar for each card. A click on a bar shows that card.
 */
export const StoryProgress: React.FC<StoryProgressProps> = ({
  currentCardIndex,
  totalCards,
  onJumpToCard,
  isAutoPlaying,
  autoPlayDuration,
  isNavigatingBackward,
}) => {
  const barsClassName = [
    'progress-bars',
    isAutoPlaying && 'autoplay',
    isNavigatingBackward && 'backward',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="story-progress-container">
      <div
        className={barsClassName}
        style={{ '--auto-play-duration': `${autoPlayDuration}ms` } as React.CSSProperties}
      >
        {Array.from({ length: totalCards }, (_, index) => {
          const state =
            index === currentCardIndex ? 'active' : index < currentCardIndex ? 'completed' : '';
          return (
            <button
              key={index}
              type="button"
              className={`progress-bar ${state}`}
              onClick={() => onJumpToCard(index)}
              aria-label={`Card ${index + 1} of ${totalCards}`}
              aria-current={index === currentCardIndex ? 'step' : undefined}
            >
              <span className="progress-fill" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
