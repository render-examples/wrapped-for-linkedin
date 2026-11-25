import React, { useRef } from 'react';
import { ShareButton } from '@components/WrappedStories/ShareButton';
import { StoryProgress } from '@components/WrappedStories/StoryProgress';
import { Icon } from '@components/Icon';
import { BadgeEmblem } from '@components/BadgeEmblem';
import type { AudienceSection, ShareableCard, ShareInfo, StoryBadge } from '@/types/wrappedStories';
import { getLinkedInEmbedUrl } from '@utils/linkedinEmbed';
import { usePostStatus } from '@/hooks/usePostStatus';

interface StoryCardProps {
  card: ShareableCard;
  isActive: boolean;
  cardIndex: number;
  cardRef?: React.RefObject<HTMLDivElement>;
  allCards?: React.RefObject<HTMLDivElement>[];
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
  const cardRef = externalCardRef || internalCardRef;
  const peakEmbedUrl = card.data.url ? getLinkedInEmbedUrl(card.data.url) : null;
  const isPeakPostPublic = usePostStatus(card.type === 'top-post' ? card.data.url : undefined);

  return (
    <div
      ref={cardRef}
      className={`story-card ${card.type} ${isActive ? 'active' : ''}`}
      style={{
        '--card-accent': card.accent,
        '--card-bg-color': card.backgroundColor,
      } as React.CSSProperties & { [key: string]: string }}
      role="region"
      aria-label={card.title}
    >
      {/* Progress Bars - Inside Card at Top */}
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

      {/* Card Content */}
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
          ) : card.type === 'audience-snapshot' ? (
            <div className="audience-snapshot">
              {card.data.context && <div className="card-context">{card.data.context}</div>}
              {card.data.sections.map((section: AudienceSection) => (
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
          ) : card.type === 'badges' ? (
            <div className="story-badges">
              {card.data.context && <div className="card-context">{card.data.context}</div>}
              <div className="story-badge-list">
                {card.data.badges.map((badge: StoryBadge) => (
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
          ) : card.type === 'top-post' ? (
            // Peak Performer card with LinkedIn embed and metrics
            <div className="peak-performer-content">
              {/* Metrics Display */}
              <div className="peak-post-metrics">
                <div className="peak-metric">
                  <div className="peak-metric-icon">
                    <img src="/images/dashboard/heart.png" alt="Heart" />
                  </div>
                  <div className="peak-metric-info">
                    <div className="peak-metric-value">{card.data.value}</div>
                    <div className="peak-metric-label">Engagements</div>
                  </div>
                </div>
                {card.data.impressions && (
                  <div className="peak-metric">
                    <div className="peak-metric-icon">
                      <img src="/images/dashboard/sparkle.png" alt="Sparkle" />
                    </div>
                    <div className="peak-metric-info">
                      <div className="peak-metric-value">{card.data.impressions}</div>
                      <div className="peak-metric-label">Impressions</div>
                    </div>
                  </div>
                )}
              </div>

              {/* LinkedIn Post Embed */}
              <div className="peak-post-embed-wrapper">
                {peakEmbedUrl && isPeakPostPublic === false ? (
                  <div className="peak-post-unavailable">
                    <div className="fallback-emoji">
                      <Icon name="trophy" />
                    </div>
                    <a
                      href={card.data.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="post-status-link"
                    >
                      Open post
                    </a>
                  </div>
                ) : peakEmbedUrl ? (
                  <div className="peak-post-embed-container">
                    <iframe
                      src={peakEmbedUrl}
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

              {/* Post Context */}
              {card.data.date && (
                <div className="peak-post-context">
                  Your most impactful moment
                </div>
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
          <div className="branding">Wrapped for LinkedIn</div>
          <ShareButton
            cardId={card.id}
            card={card}
            cardRef={cardRef as React.RefObject<HTMLDivElement>}
            allCards={allCards}
            shareInfo={shareInfo}
            onPauseAutoplay={onPauseAutoplay}
          />
        </div>
      </div>
    </div>
  );
};
