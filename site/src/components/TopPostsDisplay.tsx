import React, { useMemo } from 'react';
import type { TopPost } from '@types';
import { Icon } from '@components/Icon';
import { formatDateString } from '@utils/formatters';
import { getLinkedInEmbedUrl } from '@utils/linkedinEmbed';
import { usePostStatus } from '@/hooks/usePostStatus';
import '@styles/TopPostsDisplay.css';

interface TopPostsDisplayProps {
  posts: TopPost[];
}

function formatCount(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return String(Math.round(num));
}

export const TopPostsDisplay: React.FC<TopPostsDisplayProps> = ({ posts }) => {
  const displayedPosts = useMemo(() => {
    return (posts ?? []).slice(0, 6).map(post => ({
      ...post,
      embedUrl: getLinkedInEmbedUrl(post.url)
    }));
  }, [posts]);

  if (!posts || posts.length === 0) {
    return null;
  }

  return (
    <div className="top-posts-section">
      <div className="section-header">
        <div>
          <p className="section-eyebrow">Top posts</p>
          <h2 className="section-title">What resonated most</h2>
        </div>
      </div>

      {/* FAQ Section */}
      <details className="metrics-faq">
        <summary className="faq-summary">FAQ</summary>
        <div className="faq-content">
          <div className="faq-item">
            <p className="faq-question">Why are some posts not found?</p>
            <p className="faq-answer">LinkedIn only allows public posts to be embedded. For other posts, the app shows your stats from the file and a link to open the post on LinkedIn.</p>
          </div>
          
          <div className="faq-item">
            <p className="faq-question">Why don't my exported numbers match what I see on my LinkedIn posts?</p>
            <p className="faq-answer"><strong>Time window:</strong> Your LinkedIn export captures the last 365 days of activity only. Older posts display metrics from within this rolling window, not their all-time totals.</p>
            <p className="faq-answer"><strong>Engagement types:</strong> The export includes all engagement types (reactions, comments, shares, reposts, and clicks), while LinkedIn posts publicly show only reactions and comments.</p>
          </div>
        </div>
      </details>

      <div className="posts-container">
        {displayedPosts.map((post) => {
          const handlePostClick = () => {
            window.open(post.url, '_blank');
          };

          return (
            <div key={post.url} className="post-card" onClick={handlePostClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && handlePostClick()}>
              <div className="post-header">
                <div className="post-rank-badge">{post.rank}</div>
                <div className="post-date">{formatDateString(post.publish_date)}</div>
              </div>

              <div className="post-content">
                <div className="post-embed-wrapper">
                  <PostEmbed url={post.url} embedUrl={post.embedUrl} rank={post.rank} />
                </div>
              </div>

              <div className="top-post-stats">
                <div className="top-post-stat-box">
                  <div className="top-post-stat-icon">
                    <img src="/images/dashboard/heart.png" alt="Engagements" />
                  </div>
                  <div className="top-post-stat-info">
                    <div className="top-post-stat-value">{formatCount(post.engagements)}</div>
                    <div className="top-post-stat-label">Engagements</div>
                  </div>
                </div>
                {post.impressions && post.impressions > 0 && (
                  <div className="top-post-stat-box">
                    <div className="top-post-stat-icon">
                      <img src="/images/dashboard/sparkle.png" alt="Impressions" />
                    </div>
                    <div className="top-post-stat-info">
                      <div className="top-post-stat-value">{formatCount(post.impressions)}</div>
                      <div className="top-post-stat-label">Impressions</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface PostEmbedProps {
  url: string;
  embedUrl: string | null;
  rank: number;
}

/**
 * Show the LinkedIn embed for a public post. For a post that is not public,
 * show a trophy and a link to the post. If the check fails, keep the embed.
 */
const PostEmbed: React.FC<PostEmbedProps> = ({ url, embedUrl, rank }) => {
  const isPublic = usePostStatus(embedUrl ? url : undefined);

  if (embedUrl && isPublic !== false) {
    return (
      <iframe
        src={embedUrl}
        height="350"
        width="100%"
        allowFullScreen
        loading="lazy"
        className="linkedin-iframe"
        title={`LinkedIn post #${rank}`}
      />
    );
  }

  return (
    <div className="post-fallback">
      <div className="fallback-icon">
        <Icon name={embedUrl ? 'trophy' : 'pin'} />
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="fallback-link"
        onClick={(e) => e.stopPropagation()}
      >
        Open post
      </a>
    </div>
  );
};
