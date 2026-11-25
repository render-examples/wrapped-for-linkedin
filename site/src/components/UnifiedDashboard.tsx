import React, { useMemo } from 'react';
import { SpotifyDashboard } from '@components/SpotifyDashboard';
import { TopPostsDisplay } from '@components/TopPostsDisplay';
import { DemographicsView } from '@components/DemographicsView';
import { WrappedStoriesContainer } from '@components/WrappedStories/WrappedStoriesContainer';
import { FinalMessage } from '@components/FinalMessage';
import { BadgesSection } from '@components/BadgesSection';
import { getEarnedBadges } from '@utils/badges';
import { generateShareableCards } from '@utils/cardDataMapper';
import { formatNumber, getWrappedYear } from '@utils/formatters';
import type { EngagementMetrics, DemographicInsights } from '@types';
import type { ParsedExcelData } from '@utils/excel/types';
import type { ShareInfo } from '@/types/wrappedStories';
import '@styles/UnifiedDashboard.css';

interface UnifiedDashboardProps {
  data: EngagementMetrics;
  demographics?: DemographicInsights;
  onUploadNewData?: () => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  data,
  demographics,
  onUploadNewData,
}) => {
  const discoveryData = data.discovery_data;
  const topPosts = data.top_posts ?? [];

  const excelData = useMemo<ParsedExcelData>(() => ({
    discovery_data: discoveryData,
    top_posts: data.top_posts,
    demographics,
    engagement_by_day: data.engagementByDay,
  }), [discoveryData, data.top_posts, demographics, data.engagementByDay]);

  const wrappedCards = useMemo(
    () => (discoveryData ? generateShareableCards(excelData) : []),
    [discoveryData, excelData]
  );

  const earnedBadges = useMemo(() => getEarnedBadges(excelData), [excelData]);

  const shareInfo = useMemo<ShareInfo>(() => ({
    impressions: formatNumber(discoveryData?.total_impressions || 0),
    membersReached: formatNumber(discoveryData?.members_reached || 0),
    year: getWrappedYear(discoveryData),
    topPostUrl: data.top_posts?.[0]?.url,
    topBadgeSentence: earnedBadges[0]?.shareSentence,
  }), [discoveryData, data.top_posts, earnedBadges]);

  return (
    <div className="unified-dashboard">
      {wrappedCards.length > 0 && (
        <WrappedStoriesContainer
          cards={wrappedCards}
          shareInfo={shareInfo}
          autoPlayDuration={5000}
          onUploadNewData={onUploadNewData}
        />
      )}

      <BadgesSection badges={earnedBadges} />

      {discoveryData && (
        <SpotifyDashboard
          discovery={discoveryData}
          engagementByDay={data.engagementByDay}
        />
      )}

      {topPosts.length > 0 && (
        <TopPostsDisplay posts={topPosts} />
      )}

      {demographics && (
        <DemographicsView demographics={demographics} />
      )}

      {!discoveryData && !demographics && (
        <div className="fallback-section">
          <h1 className="fallback-title">Your LinkedIn year in review</h1>

          {topPosts.length > 0 ? (
            <TopPostsDisplay posts={topPosts} />
          ) : (
            <div className="empty-state">
              <p>No analytics data available for this file.</p>
            </div>
          )}
        </div>
      )}

      <FinalMessage />
    </div>
  );
};
