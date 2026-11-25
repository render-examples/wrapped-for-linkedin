import React from 'react';
import { calculateBestMonth } from '@utils/bestMonthCalculator';
import { formatDate, formatNumber, getWrappedYear } from '@utils/formatters';
import type { EngagementByDay } from '@utils/excel/types';
import type { DiscoveryData } from '@types';
import '@styles/YearSummary.css';

interface YearSummaryProps {
  discovery: DiscoveryData;
  engagementByDay?: EngagementByDay[];
}

const MetricCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="metric-card">
    <h3 className="mono-label">{label}</h3>
    <div className="metric-card-value">{value}</div>
  </div>
);

export const YearSummary: React.FC<YearSummaryProps> = ({ discovery, engagementByDay }) => {
  const year = getWrappedYear(discovery);
  const bestMonth = engagementByDay?.length ? calculateBestMonth(engagementByDay) : null;

  return (
    <div className="wrapped-section">
      <p className="section-eyebrow">Year in review</p>
      <h2 className="section-title">Your {year} performance review</h2>
      <p className="section-subtitle">
        {discovery.start_date && discovery.end_date && (
          <>
            {formatDate(discovery.start_date)} – {formatDate(discovery.end_date)}
          </>
        )}
      </p>
      <div className="wrapped-metrics-grid">
        <MetricCard
          label="Total impressions"
          value={formatNumber(discovery.total_impressions || 0)}
        />
        <MetricCard label="Members reached" value={formatNumber(discovery.members_reached || 0)} />
        <MetricCard label="New followers" value={formatNumber(discovery.new_followers || 0)} />
        <MetricCard
          label="Total engagements"
          value={formatNumber(discovery.total_engagements || 0)}
        />
        {bestMonth && <MetricCard label="Best month" value={bestMonth.monthYear} />}
        <MetricCard
          label="Median daily impressions"
          value={formatNumber(discovery.median_daily_impressions || 0)}
        />
      </div>
    </div>
  );
};
