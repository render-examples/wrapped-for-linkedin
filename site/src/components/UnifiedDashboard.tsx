import React, { useMemo } from 'react';
import { YearSummary } from '@components/YearSummary';
import { TopPostsDisplay } from '@components/TopPostsDisplay';
import { DemographicsView } from '@components/DemographicsView';
import { WrappedStoriesContainer } from '@components/WrappedStories/WrappedStoriesContainer';
import { FinalMessage } from '@components/FinalMessage';
import { BadgesSection } from '@components/BadgesSection';
import { getEarnedBadges } from '@utils/badges';
import { generateShareableCards } from '@utils/cardDataMapper';
import { formatNumber, getWrappedYear } from '@utils/formatters';
import type { ParsedExcelData } from '@utils/excel/types';
import type { ShareInfo } from '@/types/wrappedStories';
import '@styles/UnifiedDashboard.css';

interface UnifiedDashboardProps {
  data: ParsedExcelData;
  onUploadNewData?: () => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({ data, onUploadNewData }) => {
  const { discovery_data: discoveryData, demographics, engagement_by_day: engagementByDay } = data;
  const topPosts = data.top_posts ?? [];
  const topPostUrl = topPosts[0]?.url;
  const hasAnyData = Boolean(discoveryData || demographics || topPosts.length > 0);

  const wrappedCards = useMemo(
    () => (discoveryData ? generateShareableCards(data) : []),
    [data, discoveryData],
  );

  const earnedBadges = useMemo(() => getEarnedBadges(data), [data]);

  const shareInfo = useMemo<ShareInfo>(
    () => ({
      impressions: formatNumber(discoveryData?.total_impressions || 0),
      membersReached: formatNumber(discoveryData?.members_reached || 0),
      year: getWrappedYear(discoveryData),
      topPostUrl,
      topBadgeSentence: earnedBadges[0]?.shareSentence,
    }),
    [discoveryData, topPostUrl, earnedBadges],
  );

  return (
    <div className="unified-dashboard">
      {wrappedCards.length > 0 && (
        <WrappedStoriesContainer
          cards={wrappedCards}
          shareInfo={shareInfo}
          onUploadNewData={onUploadNewData}
        />
      )}

      <BadgesSection badges={earnedBadges} />

      {discoveryData && <YearSummary discovery={discoveryData} engagementByDay={engagementByDay} />}

      {topPosts.length > 0 && <TopPostsDisplay posts={topPosts} />}

      {demographics && <DemographicsView demographics={demographics} />}

      {!hasAnyData && (
        <div className="fallback-section">
          <h1 className="fallback-title">Your LinkedIn year in review</h1>
          <div className="empty-state">
            <p>No analytics data available for this file.</p>
          </div>
        </div>
      )}

      <FinalMessage />
    </div>
  );
};
