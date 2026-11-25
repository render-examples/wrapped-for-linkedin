import React, { useRef } from 'react';
import { ShareButton } from '@components/WrappedStories/ShareButton';
import { StoryProgress } from '@components/WrappedStories/StoryProgress';
import { Icon } from '@components/Icon';
import { BadgeEmblem } from '@components/BadgeEmblem';
import type { CardData, ShareableCard, ShareInfo } from '@/types/wrappedStories';
import { getLinkedInEmbedUrl } from '@utils/linkedinEmbed';
import { usePostStatus } from '@/hooks/usePostStatus';

interface StoryCardProps {
  card: ShareableCard;
  isActive: boolean;
  cardRef?: React.RefObject<HTMLDivElement | null>;
  allCards?: React.RefObject<HTMLDivElement | null>[];
  shareInfo: ShareInfo;
  onPauseAutoplay?: () => void;
  currentCardIndex: number;
  totalCards: number;
  onJumpToCard: (index: number) => void;
  isAutoPlaying?: boolean;
  autoPlayDuration?: number;
  isNavigatingBackward?: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  card,
  isActive,
  cardRef: externalCardRef,
  allCards,
  shareInfo,
  onPauseAutoplay,
  currentCardIndex,
  totalCards,
  onJumpToCard,
  isAutoPlaying = false,
  autoPlayDuration = 5000,
  isNavigatingBackward = false,
}) => {
  const internalCardRef = useRef<HTMLDivElement>(null);
  const cardRef = externalCardRef ?? internalCardRef;

  return (
    <div
      ref={cardRef}
      className={`story-card ${card.type} ${isActive ? 'active' : ''}`}
      style={{
        '--card-accent': card.accent,
        '--card-bg-color': card.backgroundColor,
      } as React.CSSProperties}
      role="region"
      aria-label={card.title}
    >
      <div className="card-progress-wrapper">
        <StoryProgress
          currentCardIndex={currentCardIndex}
          totalCards={totalCards}
          onJumpToCard={onJumpToCard}
          isAutoPlaying={isAutoPlaying}
          autoPlayDuration={autoPlayDuration}
          isNavigatingBackward={isNavigatingBackward}
        />
      </div>

      <div className="card-content-wrapper">
        <div className="card-header">
          <h2 className="card-title">{card.title}</h2>
          <img
            src="/images/dashboard/wrapped-logo.png"
            alt="Wrapped for LinkedIn"
            className="card-logo"
          />
        </div>

        <div className="card-body">
          {card.data.icon && (
            <span className="card-icon">
              <Icon name={card.data.icon} />
            </span>
          )}

          <CardBody card={card} />
        </div>

        <div className="card-footer">
          <div className="branding">Wrapped for LinkedIn</div>
          <ShareButton
            card={card}
            cardRef={cardRef}
            allCards={allCards}
            shareInfo={shareInfo}
            onPauseAutoplay={onPauseAutoplay}
          />
        </div>
      </div>
    </div>
  );
};

/**
 * The main content of a card. The layout depends on the card type.
 */
const CardBody: React.FC<{ card: ShareableCard }> = ({ card }) => {
  switch (card.type) {
    case 'year-summary':
      return (
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
      );

    case 'audience-snapshot':
      return (
        <div className="audience-snapshot">
          {card.data.context && <div className="card-context">{card.data.context}</div>}
          {card.data.sections.map((section) => (
            <div key={section.label} className="audience-section">
              <div className="audience-section-label">{section.label}</div>
              <ol className="audience-list">
                {section.items.map((item) => (
                  <li key={item.name} className="audience-item">
                    <span className="audience-item-name">{item.name}</span>
                    <span className="audience-item-percentage">{item.percentage < 1 ? '<1' : item.percentage}%</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      );

    case 'badges':
      return (
        <div className="story-badges">
          {card.data.context && <div className="card-context">{card.data.context}</div>}
          <div className="story-badge-list">
            {card.data.badges.map((badge) => (
              <div key={badge.id} className="story-badge">
                <BadgeEmblem icon={badge.icon} className="story-badge-art" />
                <div className="story-badge-text">
                  <div className="story-badge-name">{badge.name}</div>
                  <div className="story-badge-rule">{badge.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'top-post':
      return <TopPostBody data={card.data} />;

    default:
      return (
        <>
          {card.data.value && <div className="card-value">{card.data.value}</div>}
          {card.data.label && <div className="card-label">{card.data.label}</div>}
          {card.data.context && <div className="card-context">{card.data.context}</div>}
        </>
      );
  }
};

/**
 * The top post card. It shows the post metrics and the LinkedIn embed.
 * If the post is not public, it shows a trophy and a link to the post.
 */
const TopPostBody: React.FC<{ data: CardData }> = ({ data }) => {
  const embedUrl = data.url ? getLinkedInEmbedUrl(data.url) : null;
  const isPublic = usePostStatus(data.url);

  return (
    <div className="peak-performer-content">
      <div className="peak-post-metrics">
        <div className="peak-metric">
          <div className="peak-metric-icon">
            <img src="/images/dashboard/heart.png" alt="Heart" />
          </div>
          <div className="peak-metric-info">
            <div className="peak-metric-value">{data.value}</div>
            <div className="peak-metric-label">Engagements</div>
          </div>
        </div>
        {data.impressions && (
          <div className="peak-metric">
            <div className="peak-metric-icon">
              <img src="/images/dashboard/sparkle.png" alt="Sparkle" />
            </div>
            <div className="peak-metric-info">
              <div className="peak-metric-value">{data.impressions}</div>
              <div className="peak-metric-label">Impressions</div>
            </div>
          </div>
        )}
      </div>

      <div className="peak-post-embed-wrapper">
        {embedUrl && isPublic === false ? (
          <div className="peak-post-unavailable">
            <div className="fallback-emoji">
              <Icon name="trophy" />
            </div>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="post-status-link"
            >
              Open post
            </a>
          </div>
        ) : embedUrl ? (
          <div className="peak-post-embed-container">
            <iframe
              src={embedUrl}
              height="300"
              width="100%"
              allowFullScreen
              loading="lazy"
              className="peak-post-iframe"
              title="Peak Performer Post"
            />
          </div>
        ) : (
          <div className="peak-post-fallback">
            <div className="fallback-emoji">
              <Icon name="pin" />
            </div>
            <p className="fallback-message">Top Post</p>
          </div>
        )}
      </div>

      {data.date && <div className="peak-post-context">Your most impactful moment</div>}
    </div>
  );
};
