import React from 'react';
import { ShareButton } from '@components/WrappedStories/ShareButton';
import { Icon } from '@components/Icon';
import { BadgeEmblem } from '@components/BadgeEmblem';
import type { CardData, ShareableCard, ShareInfo } from '@/types/wrappedStories';
import { PostEmbed } from '@components/PostEmbed';

interface StoryCardProps {
  card: ShareableCard;
  isActive: boolean;
  cardRef: React.RefObject<HTMLDivElement | null>;
  allCardRefs: React.RefObject<HTMLDivElement | null>[];
  shareInfo: ShareInfo;
  onPauseAutoPlay: () => void;
}

export const StoryCard: React.FC<StoryCardProps> = ({
  card,
  isActive,
  cardRef,
  allCardRefs,
  shareInfo,
  onPauseAutoPlay,
}) => {
  return (
    <div
      ref={cardRef}
      className={`story-card ${card.type} ${isActive ? 'active' : ''}`}
      style={{ '--card-accent': card.accent } as React.CSSProperties}
      role="region"
      aria-label={card.title}
    >
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
          <SummaryMetric label="Total impressions" value={card.data.impressions} />
          <SummaryMetric label="Members reached" value={card.data.membersReached} />
          <SummaryMetric label="Total engagements" value={card.data.engagements} />
          <SummaryMetric label="New followers" value={card.data.newFollowers} />
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
                    <span className="audience-item-percentage">
                      {item.percentage < 1 ? '<1' : item.percentage}%
                    </span>
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
  label: string;
  value: React.ReactNode;
}

const PeakMetric: React.FC<PeakMetricProps> = ({ icon, label, value }) => (
  <div className="peak-metric">
    <div className="peak-metric-icon">
      <img src={icon} alt="" />
    </div>
    <div className="peak-metric-info">
      <div className="peak-metric-value">{value}</div>
      <div className="peak-metric-label">{label}</div>
    </div>
  </div>
);

/**
 * The top post card. It shows the post metrics and the LinkedIn embed.
 */
const TopPostBody: React.FC<{ data: CardData }> = ({ data }) => (
  <div className="peak-performer-content">
    <div className="peak-post-metrics">
      <PeakMetric icon="/images/dashboard/heart.png" label="Engagements" value={data.value} />
      {data.impressions && (
        <PeakMetric
          icon="/images/dashboard/sparkle.png"
          label="Impressions"
          value={data.impressions}
        />
      )}
    </div>

    <div className="peak-post-embed-wrapper">
      {data.url ? (
        <PostEmbed url={data.url} title="Peak performer post" variant="card" />
      ) : (
        <div className="peak-post-fallback">
          <div className="peak-post-fallback-icon">
            <Icon name="pin" />
          </div>
          <p className="fallback-message">Top post</p>
        </div>
      )}
    </div>

    {data.date && <div className="peak-post-context">Your most impactful moment</div>}
  </div>
);
