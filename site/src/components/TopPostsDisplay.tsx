import React from 'react';
import type { TopPost } from '@types';
import { PostEmbed } from '@components/PostEmbed';
import { formatDateString, formatNumber } from '@utils/formatters';
import '@styles/TopPostsDisplay.css';

interface TopPostsDisplayProps {
  posts: TopPost[];
}

const MAX_DISPLAYED_POSTS = 6;

export const TopPostsDisplay: React.FC<TopPostsDisplayProps> = ({ posts }) => {
  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="top-posts-section">
      <div className="section-header">
        <p className="section-eyebrow">Top posts</p>
        <h2 className="section-title">What resonated most</h2>
      </div>

      <details className="metrics-faq">
        <summary className="faq-summary">FAQ</summary>
        <div className="faq-content">
          <div className="faq-item">
            <p className="faq-question">Why are some posts not found?</p>
            <p className="faq-answer">
              LinkedIn only allows public posts to be embedded. For other posts, the app shows your
              stats from the file and a link to open the post on LinkedIn.
            </p>
          </div>

          <div className="faq-item">
            <p className="faq-question">
              Why don't my exported numbers match what I see on my LinkedIn posts?
            </p>
            <p className="faq-answer">
              <strong>Time window:</strong> Your LinkedIn export captures the last 365 days of
              activity only. Older posts display metrics from within this rolling window, not their
              all-time totals.
            </p>
            <p className="faq-answer">
              <strong>Engagement types:</strong> The export includes all engagement types
              (reactions, comments, shares, reposts, and clicks), while LinkedIn posts publicly show
              only reactions and comments.
            </p>
          </div>
        </div>
      </details>

      <div className="posts-container">
        {posts.slice(0, MAX_DISPLAYED_POSTS).map((post) => (
          <div key={post.url} className="post-card">
            <div className="post-header">
              <div className="post-rank-badge">{post.rank}</div>
              <div className="post-date">{formatDateString(post.publish_date)}</div>
            </div>

            <div className="post-embed-wrapper">
              <PostEmbed url={post.url} title={`LinkedIn post #${post.rank}`} variant="list" />
            </div>

            <div className="top-post-stats">
              <PostStat
                icon="/images/dashboard/heart.png"
                label="Engagements"
                value={post.engagements}
              />
              {post.impressions !== undefined && post.impressions > 0 && (
                <PostStat
                  icon="/images/dashboard/sparkle.png"
                  label="Impressions"
                  value={post.impressions}
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

interface PostStatProps {
  icon: string;
  label: string;
  value: number;
}

const PostStat: React.FC<PostStatProps> = ({ icon, label, value }) => (
  <div className="top-post-stat-box">
    <div className="top-post-stat-icon">
      <img src={icon} alt={label} />
    </div>
    <div className="top-post-stat-info">
      <div className="top-post-stat-value">{formatNumber(value)}</div>
      <div className="top-post-stat-label">{label}</div>
    </div>
  </div>
);
