import React, { useMemo } from 'react';
import type { DemographicInsights, DemographicItem } from '@types';
import '@styles/Demographics.css';

interface DemographicsViewProps {
  demographics: DemographicInsights;
}

const DemographicCategory: React.FC<{
  title: string;
  items: DemographicItem[];
  icon: string;
}> = ({ title, items, icon }) => {
  const topItems = useMemo(() => items.slice(0, 5), [items]);

  if (topItems.length === 0) return null;

  return (
    <div className="demographic-category">
      <div className="category-header">
        <img src={icon} alt={title} className="category-icon" />
        <h3 className="category-title">{title}</h3>
      </div>
      <div className="category-items">
        {topItems.map((item, index) => (
          <div key={index} className="demographic-item">
            <div className="item-info">
              <span className="item-name">{item.name}</span>
              <span className="item-percentage">{Math.round(item.percentage * 100)}%</span>
            </div>
            <div className="item-bar">
              <div
                className="item-bar-fill"
                style={{ width: `${Math.min(item.percentage * 100, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const CATEGORIES: { key: keyof DemographicInsights; title: string; icon: string }[] = [
  { key: 'job_titles', title: 'Job titles', icon: '/images/demographics/job-titles.png' },
  { key: 'locations', title: 'Locations', icon: '/images/demographics/locations.png' },
  { key: 'industries', title: 'Industries', icon: '/images/demographics/industries.png' },
  { key: 'seniority', title: 'Seniority levels', icon: '/images/demographics/seniority-levels.png' },
  { key: 'company_size', title: 'Company size', icon: '/images/demographics/company-size.png' },
  { key: 'companies', title: 'Companies', icon: '/images/demographics/companies.png' },
];

export const DemographicsView: React.FC<DemographicsViewProps> = ({ demographics }) => {
  const hasData =
    demographics?.job_titles?.length > 0 ||
    demographics?.locations?.length > 0 ||
    demographics?.industries?.length > 0;

  if (!hasData) {
    return (
      <div className="demographics-view empty-state">
        <p>No demographic data available</p>
      </div>
    );
  }

  return (
    <div className="demographics-view">
      <div className="demographics-header">
        <p className="section-eyebrow">Your audience</p>
        <h2 className="section-title">Who saw your posts</h2>
      </div>

      <div className="demographics-grid">
        {CATEGORIES.map(({ key, title, icon }) => {
          const items = demographics[key];
          return items && items.length > 0 ? (
            <DemographicCategory key={key} title={title} items={items} icon={icon} />
          ) : null;
        })}
      </div>
    </div>
  );
};
