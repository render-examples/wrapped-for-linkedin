import React from 'react';
import { getWrappedYear } from '@utils/formatters';
import { calculateBestMonth } from '@utils/bestMonthCalculator';
import { formatNumber, parseISODate } from '@utils/formatters';
import type { EngagementByDay } from '@utils/excel/types';
import type { DiscoveryData } from '@types';
import '@styles/SpotifyDashboard.css';

interface SpotifyDashboardProps {
  discovery?: DiscoveryData;
  engagementByDay?: EngagementByDay[];
}

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="metric-card">
    <h3 className="metric-card-label">{label}</h3>
    <div className="metric-card-value">{value}</div>
  </div>
);

export const SpotifyDashboard: React.FC<SpotifyDashboardProps> = ({
  discovery,
  engagementByDay,
}) => {

  const year = discovery?.end_date ? getWrappedYear(discovery) : new Date().getFullYear();

  // Calculate best month from engagement data
  const bestMonth = engagementByDay && engagementByDay.length > 0 ? calculateBestMonth(engagementByDay) : null;

  return (
    <>
      {/* Your <year> Wrapped - Unified Metrics Section */}
      <div className="wrapped-section">
        <p className="section-eyebrow">Year in review</p>
        <h2 className="section-title">Your Wrapped for LinkedIn {year}</h2>
        <p className="section-subtitle">
          {discovery?.start_date && discovery?.end_date ? (
            <>
              {parseISODate(discovery.start_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} – {parseISODate(discovery.end_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </>
          ) : null}
        </p>
        <div className="wrapped-metrics-grid">
          <MetricCard label="Total impressions" value={formatNumber(discovery?.total_impressions || 0)} />
          <MetricCard label="Members reached" value={formatNumber(discovery?.members_reached || 0)} />
          <MetricCard label="New followers" value={formatNumber(discovery?.new_followers || 0)} />
          <MetricCard label="Total engagements" value={formatNumber(discovery?.total_engagements || 0)} />
          {bestMonth && <MetricCard label="Best month" value={bestMonth.monthYear} />}
          <MetricCard label="Median daily impressions" value={formatNumber(discovery?.average_impressions_per_day || 0)} />
        </div>
      </div>
    </>
  );
};
