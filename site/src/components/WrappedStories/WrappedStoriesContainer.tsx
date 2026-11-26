import React, { createRef, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { StoryCard } from '@components/WrappedStories/StoryCard';
import { StoryProgress } from '@components/WrappedStories/StoryProgress';
import type { ShareableCard, ShareInfo } from '@/types/wrappedStories';
import { isCardNavigationTouch } from '@utils/storyTouch';
import { useShortcutKeys } from '@/hooks/useShortcutKeys';
import { useStoryNavigation } from '@/hooks/useStoryNavigation';
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

interface TouchStart {
  x: number;
  y: number;
  time: number;
}

interface SwipeArrow {
  direction: 'left' | 'right';
  // A new key for each swipe makes the arrow animation play again.
  key: number;
}

export const WrappedStoriesContainer: React.FC<WrappedStoriesContainerProps> = ({
  cards,
  shareInfo,
  autoPlayDuration = 5000,
  onUploadNewData,
}) => {
  const totalCards = cards.length;
  const { currentIndex, isBackward, next, previous, jumpTo } = useStoryNavigation(totalCards);
  // The user paused autoplay with the pause button or the share menu.
  const [userPaused, setUserPaused] = useState(false);
  // The user holds a press on the card. Autoplay pauses until the press ends.
  const [isPressHolding, setIsPressHolding] = useState(false);
  const [swipeArrow, setSwipeArrow] = useState<SwipeArrow | null>(null);
  const swipeArrowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressHoldTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAutoPlaying = !userPaused && !isPressHolding;

  // The PDF export reads every card, so each card gets a ref.
  const cardRefs = useMemo(
    () => Array.from({ length: totalCards }, () => createRef<HTMLDivElement>()),
    [totalCards],
  );

  // While autoplay is on, go to the next card after each card's time.
  // The timer starts again each time the card changes.
  useEffect(() => {
    if (!isAutoPlaying || totalCards === 0) return;
    const timer = setTimeout(next, autoPlayDuration);
    return () => clearTimeout(timer);
  }, [currentIndex, isAutoPlaying, autoPlayDuration, totalCards, next]);

  // Clear the gesture timers when the component unmounts.
  useEffect(() => {
    const swipeArrowTimer = swipeArrowTimerRef;
    const pressHoldTimer = pressHoldTimerRef;
    return () => {
      if (swipeArrowTimer.current) clearTimeout(swipeArrowTimer.current);
      if (pressHoldTimer.current) clearTimeout(pressHoldTimer.current);
    };
  }, []);

  // Child components, such as ShareButton, call this to pause autoplay.
  const handlePauseAutoPlay = useCallback(() => setUserPaused(true), []);

  const handleToggleAutoPlay = () => setUserPaused((paused) => !paused);

  useShortcutKeys((event) => {
    if (event.key === 'ArrowRight') {
      next();
    } else if (event.key === 'ArrowLeft') {
      previous();
    }
  });

  const showSwipeArrow = (direction: SwipeArrow['direction']) => {
    setSwipeArrow((current) => ({ direction, key: (current?.key ?? 0) + 1 }));
    if (swipeArrowTimerRef.current) clearTimeout(swipeArrowTimerRef.current);
    swipeArrowTimerRef.current = setTimeout(() => {
      swipeArrowTimerRef.current = null;
      setSwipeArrow(null);
    }, SWIPE_ARROW_DURATION);
  };

  const touchStartRef = useRef<TouchStart | null>(null);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isCardNavigationTouch(e.target as Element, e.currentTarget)) {
      touchStartRef.current = null;
      return;
    }
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const touchStart = touchStartRef.current;
    if (!touchStart) return;
    touchStartRef.current = null;

    const touchDuration = Date.now() - touchStart.time;
    const horizontalDifference = touchStart.x - e.changedTouches[0].clientX;
    const verticalDifference = Math.abs(touchStart.y - e.changedTouches[0].clientY);

    const isSwipe =
      Math.abs(horizontalDifference) > SWIPE_MIN_DISTANCE &&
      verticalDifference < SWIPE_MIN_DISTANCE;
    const isTap =
      Math.abs(horizontalDifference) < TAP_MAX_DISTANCE &&
      verticalDifference < TAP_MAX_DISTANCE &&
      touchDuration < TAP_MAX_DURATION;

    if (isSwipe) {
      if (horizontalDifference > 0) {
        showSwipeArrow('left');
        next();
      } else {
        showSwipeArrow('right');
        previous();
      }
    } else if (isTap) {
      // A tap on the right half goes to the next card. A tap on the left half goes back.
      const midpoint = e.currentTarget.offsetWidth / 2;
      if (touchStart.x > midpoint) {
        next();
      } else {
        previous();
      }
    }
  };

  // Press and hold pauses autoplay, as in Instagram stories.
  // A press on a control, such as Share or an embed link, does not count.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isCardNavigationTouch(e.target as Element, e.currentTarget)) return;
    if (pressHoldTimerRef.current) clearTimeout(pressHoldTimerRef.current);
    pressHoldTimerRef.current = setTimeout(() => {
      pressHoldTimerRef.current = null;
      setIsPressHolding(true);
    }, PRESS_HOLD_DELAY);
  };

  // At the end of a press, cancel the hold timer and end the hold.
  // Autoplay stays paused if the user paused it before the hold.
  const handlePointerUp = () => {
    if (pressHoldTimerRef.current) {
      clearTimeout(pressHoldTimerRef.current);
      pressHoldTimerRef.current = null;
    }
    setIsPressHolding(false);
  };

  if (totalCards === 0) {
    return null;
  }

  return (
    <div className="wrapped-stories-container">
      <button
        className="side-nav-button side-nav-prev"
        onClick={previous}
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
        {swipeArrow && (
          <div key={swipeArrow.key} className={`swipe-arrow swipe-arrow-${swipeArrow.direction}`}>
            {swipeArrow.direction === 'left' ? '→' : '←'}
          </div>
        )}

        <StoryProgress
          currentCardIndex={currentIndex}
          totalCards={totalCards}
          onJumpToCard={jumpTo}
          isAutoPlaying={isAutoPlaying}
          autoPlayDuration={autoPlayDuration}
          isNavigatingBackward={isBackward}
        />

        {/* All cards render, so the PDF export can read them. CSS shows only the active card. */}
        {cards.map((card, index) => (
          <StoryCard
            key={card.id}
            card={card}
            isActive={index === currentIndex}
            cardRef={cardRefs[index]}
            allCardRefs={cardRefs}
            shareInfo={shareInfo}
            onPauseAutoPlay={handlePauseAutoPlay}
          />
        ))}
      </div>

      <button
        className="side-nav-button side-nav-next"
        onClick={next}
        aria-label="Next card"
        title="Next card"
      >
        →
      </button>

      <div className="story-controls">
        <button
          className={`control-button autoplay-button ${userPaused ? '' : 'playing'}`}
          onClick={handleToggleAutoPlay}
          aria-label={userPaused ? 'Start auto-play' : 'Pause auto-play'}
          title={userPaused ? 'Play' : 'Pause'}
        >
          {userPaused ? '►' : '⏸'}
        </button>
        {onUploadNewData && (
          <button
            className="control-button mobile-only-upload"
            onClick={onUploadNewData}
            title="Upload new data"
          >
            Upload new data
          </button>
        )}
      </div>
    </div>
  );
};
