import React, { createRef, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StoryCard } from '@components/WrappedStories/StoryCard';
import type { ShareableCard, ShareInfo } from '@/types/wrappedStories';
import { isCardNavigationTouch } from '@utils/storyTouch';
import '@styles/WrappedStories.css';

interface WrappedStoriesContainerProps {
  cards: ShareableCard[];
  shareInfo: ShareInfo;
  // Time that each card shows during autoplay, in milliseconds.
  autoPlayDuration?: number;
  onUploadNewData?: () => void;
}

// Touch gesture limits, in pixels and milliseconds.
const SWIPE_MIN_DISTANCE = 50;
const TAP_MAX_DISTANCE = 10;
const TAP_MAX_DURATION = 300;
// Time that the swipe arrow shows after a swipe.
const SWIPE_ARROW_DURATION = 600;
// A press longer than this pauses autoplay. A shorter press is a tap.
const PRESS_HOLD_DELAY = 200;

export const WrappedStoriesContainer: React.FC<WrappedStoriesContainerProps> = ({
  cards,
  shareInfo,
  autoPlayDuration = 5000,
  onUploadNewData,
}) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [userManuallyPaused, setUserManuallyPaused] = useState(false);
  const [isNavigatingBackward, setIsNavigatingBackward] = useState(false);
  const [swipeArrowDirection, setSwipeArrowDirection] = useState<'left' | 'right' | null>(null);
  const [isPressHolding, setIsPressHolding] = useState(false);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeArrowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The PDF export reads every card, so each card gets a ref.
  const cardRefs = useMemo(
    () => Array.from({ length: cards.length }, () => createRef<HTMLDivElement>()),
    [cards.length]
  );

  const totalCards = cards.length;

  const clearAutoPlayTimer = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearTimeout(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  const startAutoPlay = useCallback(() => {
    clearAutoPlayTimer();
    setIsAutoPlaying(true);

    autoPlayTimerRef.current = setTimeout(() => {
      // After the last card, go back to the first card.
      setCurrentCardIndex((prev) => (prev + 1 >= totalCards ? 0 : prev + 1));
    }, autoPlayDuration);
  }, [totalCards, autoPlayDuration, clearAutoPlayTimer]);

  // After the user changes the card, restart the timer unless the user paused autoplay.
  const resumeAutoPlay = useCallback(() => {
    clearAutoPlayTimer();
    if (!userManuallyPaused) {
      setIsAutoPlaying(true);
    }
  }, [clearAutoPlayTimer, userManuallyPaused]);

  const handleNext = useCallback(() => {
    setCurrentCardIndex(prev => {
      const nextIndex = prev + 1;
      if (nextIndex >= totalCards) return 0;
      setIsNavigatingBackward(false);
      return nextIndex;
    });
    resumeAutoPlay();
  }, [totalCards, resumeAutoPlay]);

  const handlePrevious = useCallback(() => {
    setCurrentCardIndex(prev => {
      const prevIndex = prev - 1;
      if (prevIndex < 0) return totalCards - 1;
      setIsNavigatingBackward(true);
      return prevIndex;
    });
    resumeAutoPlay();
  }, [totalCards, resumeAutoPlay]);

  const handleJumpToCard = useCallback((index: number) => {
    if (index >= 0 && index < totalCards) {
      setCurrentCardIndex(prevIndex => {
        setIsNavigatingBackward(index < prevIndex);
        return index;
      });
      resumeAutoPlay();
    }
  }, [totalCards, resumeAutoPlay]);

  // Child components, such as ShareButton, call this to pause autoplay.
  const handlePauseAutoPlay = useCallback(() => {
    clearAutoPlayTimer();
    setIsAutoPlaying(false);
    setUserManuallyPaused(true);
  }, [clearAutoPlayTimer]);

  const handleToggleAutoPlay = useCallback(() => {
    if (isAutoPlaying) {
      handlePauseAutoPlay();
    } else {
      setUserManuallyPaused(false);
      startAutoPlay();
    }
  }, [isAutoPlaying, handlePauseAutoPlay, startAutoPlay]);

  // The keydown listener is added one time, so it reads the latest handlers from refs.
  const handleNextRef = useRef(handleNext);
  const handlePreviousRef = useRef(handlePrevious);
  const clearAutoPlayTimerRef = useRef(clearAutoPlayTimer);

  useEffect(() => {
    handleNextRef.current = handleNext;
    handlePreviousRef.current = handlePrevious;
    clearAutoPlayTimerRef.current = clearAutoPlayTimer;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowRight':
          handleNextRef.current();
          break;
        case 'ArrowLeft':
          handlePreviousRef.current();
          break;
        case 'Escape':
          clearAutoPlayTimerRef.current();
          setIsAutoPlaying(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartTimeRef = useRef<number | null>(null);

  const clearSwipeArrowTimer = useCallback(() => {
    if (swipeArrowTimerRef.current) {
      clearTimeout(swipeArrowTimerRef.current);
      swipeArrowTimerRef.current = null;
    }
  }, []);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCardNavigationTouch(e.target as Element, e.currentTarget)) {
      touchStartXRef.current = null;
      return;
    }
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartTimeRef.current = Date.now();
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null || touchStartTimeRef.current === null) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchDuration = Date.now() - touchStartTimeRef.current;

    const horizontalDifference = touchStartXRef.current - touchEndX;
    const verticalDifference = Math.abs(touchStartYRef.current - touchEndY);

    const isSwipe =
      Math.abs(horizontalDifference) > SWIPE_MIN_DISTANCE && verticalDifference < SWIPE_MIN_DISTANCE;
    const isTap =
      Math.abs(horizontalDifference) < TAP_MAX_DISTANCE &&
      verticalDifference < TAP_MAX_DISTANCE &&
      touchDuration < TAP_MAX_DURATION;

    if (isSwipe) {
      if (horizontalDifference > 0) {
        setSwipeArrowDirection('left');
        handleNext();
      } else {
        setSwipeArrowDirection('right');
        handlePrevious();
      }

      // Hide the arrow when its animation is done.
      clearSwipeArrowTimer();
      swipeArrowTimerRef.current = setTimeout(() => {
        setSwipeArrowDirection(null);
      }, SWIPE_ARROW_DURATION);
    } else if (isTap) {
      // A tap on the right half goes to the next card. A tap on the left half goes back.
      const midpoint = e.currentTarget.offsetWidth / 2;
      if (touchStartXRef.current > midpoint) {
        handleNext();
      } else {
        handlePrevious();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
    touchStartTimeRef.current = null;
  };

  // Press and hold pauses autoplay, as in Instagram stories.
  const handlePointerDown = useCallback(() => {
    pressHoldTimerRef.current = setTimeout(() => {
      setIsPressHolding(true);
      clearAutoPlayTimer();
      setIsAutoPlaying(false);
    }, PRESS_HOLD_DELAY);
  }, [clearAutoPlayTimer]);

  const handlePointerUp = useCallback(() => {
    // Cancel the press-hold timer if it has not fired.
    if (pressHoldTimerRef.current) {
      clearTimeout(pressHoldTimerRef.current);
      pressHoldTimerRef.current = null;
    }

    // At the end of a hold, resume autoplay.
    if (isPressHolding) {
      setIsPressHolding(false);
      setUserManuallyPaused(false);
      startAutoPlay();
    }
  }, [isPressHolding, startAutoPlay]);

  // While autoplay is on, start a new timer each time the card changes.
  useEffect(() => {
    if (isAutoPlaying) {
      startAutoPlay();
    }

    return () => {
      clearAutoPlayTimer();
      clearSwipeArrowTimer();
    };
  }, [currentCardIndex, isAutoPlaying, startAutoPlay, clearAutoPlayTimer, clearSwipeArrowTimer]);

  if (cards.length === 0) {
    return null;
  }

  return (
    <div className="wrapped-stories-container">
      <button
        className="side-nav-button side-nav-prev"
        onClick={handlePrevious}
        aria-label="Previous card"
        title="Previous card"
      >
        ←
      </button>

      <div
        className="story-viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {swipeArrowDirection === 'left' && (
          <div className="swipe-arrow swipe-arrow-left">→</div>
        )}
        {swipeArrowDirection === 'right' && (
          <div className="swipe-arrow swipe-arrow-right">←</div>
        )}

        {/* All cards render, so the PDF export can read them. CSS shows only the active card. */}
        {cards.map((card, index) => (
          <StoryCard
            key={card.id}
            card={card}
            isActive={index === currentCardIndex}
            cardRef={cardRefs[index]}
            allCardRefs={cardRefs}
            shareInfo={shareInfo}
            onPauseAutoPlay={handlePauseAutoPlay}
            currentCardIndex={currentCardIndex}
            totalCards={totalCards}
            onJumpToCard={handleJumpToCard}
            isAutoPlaying={isAutoPlaying}
            autoPlayDuration={autoPlayDuration}
            isNavigatingBackward={isNavigatingBackward}
          />
        ))}
      </div>

      <button
        className="side-nav-button side-nav-next"
        onClick={handleNext}
        aria-label="Next card"
        title="Next card"
      >
        →
      </button>

      <div className="story-controls">
        <button
          className={`control-button autoplay-button ${isAutoPlaying ? 'playing' : ''}`}
          onClick={handleToggleAutoPlay}
          aria-label={isAutoPlaying ? 'Pause auto-play' : 'Start auto-play'}
          title={isAutoPlaying ? 'Pause' : 'Play'}
        >
          {isAutoPlaying ? '⏸' : '►'}
        </button>
        {onUploadNewData && (
          <button
            className="control-button upload-button mobile-only-upload"
            onClick={onUploadNewData}
            aria-label="Upload new data"
            title="Upload new data"
          >
            Upload new data
          </button>
        )}
      </div>
    </div>
  );
};
