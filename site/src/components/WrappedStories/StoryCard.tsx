import React from 'react';
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
  cardRef: React.RefObject<HTMLDivElement | null>;
  allCardRefs: React.RefObject<HTMLDivElement | null>[];
  shareInfo: ShareInfo;
  onPauseAutoPlay: () => void;
  currentCardIndex: number;
  totalCards: number;
  onJumpToCard: (index: number) => void;
  isAutoPlaying: boolean;
  autoPlayDuration: number;
  isNavigatingBackward: boolean;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  card,
  isActive,
  cardRef,
  allCardRefs,
  shareInfo,
  onPauseAutoPlay,
  currentCardIndex,
  totalCards,
  onJumpToCard,
  isAutoPlaying,
  autoPlayDuration,
  isNavigatingBackward,
}) => {
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
            allCardRefs={allCardRefs}
            shareInfo={shareInfo}
            onPauseAutoPlay={onPauseAutoPlay}
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
            <SummaryMetric label="Total impressions" value={card.data.impressions} />
            <SummaryMetric label="Members reached" value={card.data.membersReached} />
          </div>
          <div className="metric-row">
            <SummaryMetric label="Total engagements" value={card.data.engagements} />
            <SummaryMetric label="New followers" value={card.data.newFollowers} />
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

const SummaryMetric: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="metric">
    <div className="metric-value">{value}</div>
    <div className="metric-label">{label}</div>
  </div>
);

interface PeakMetricProps {
  icon: string;
  iconAlt: string;
  label: string;
  value: React.ReactNode;
}

const PeakMetric: React.FC<PeakMetricProps> = ({ icon, iconAlt, label, value }) => (
  <div className="peak-metric">
    <div className="peak-metric-icon">
      <img src={icon} alt={iconAlt} />
    </div>
    <div className="peak-metric-info">
      <div className="peak-metric-value">{value}</div>
      <div className="peak-metric-label">{label}</div>
    </div>
  </div>
);

/**
 * The top post card. It shows the post metrics and the LinkedIn embed.
 * If the post is not public, it shows a trophy and a link to the post.
 */
const TopPostBody: React.FC<{ data: CardData }> = ({ data }) => {
  const embedUrl = data.url ? getLinkedInEmbedUrl(data.url) : null;
  const isPublic = usePostStatus(embedUrl ? data.url : undefined);

  return (
    <div className="peak-performer-content">
      <div className="peak-post-metrics">
        <PeakMetric icon="/images/dashboard/heart.png" iconAlt="Heart" label="Engagements" value={data.value} />
        {data.impressions && (
          <PeakMetric
            icon="/images/dashboard/sparkle.png"
            iconAlt="Sparkle"
            label="Impressions"
            value={data.impressions}
          />
        )}
      </div>

      <div className="peak-post-embed-wrapper">
        {embedUrl && isPublic === false ? (
          <div className="peak-post-unavailable">
            <div className="peak-post-fallback-icon">
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
            <div className="peak-post-fallback-icon">
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
