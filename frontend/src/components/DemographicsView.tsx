import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { DemographicInsights } from '../types';
import '../styles/Demographics.css';

interface DemographicsViewProps {
  data: DemographicInsights;
}

const COLORS = ['#0A66C2', '#378FE9', '#4B9EFF', '#7CB9E8', '#B8D4F1', '#D4E5F7', '#E8F1FB'];

export const DemographicsView: React.FC<DemographicsViewProps> = ({ data }) => {
  return (
    <div className="demographics-container">
      <h1 className="demographics-title">Your Network Profile</h1>

      {/* Key Stats */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-number">{data.totalFollowers.toLocaleString()}</div>
          <div className="stat-label">Total Followers</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">+{data.followerGrowth.toLocaleString()}</div>
          <div className="stat-label">Follower Growth</div>
        </div>
      </div>

      {/* Job Titles */}
      {data.jobTitles && data.jobTitles.length > 0 && (
        <div className="demo-section">
          <h2>Top Job Titles in Your Network</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.jobTitles.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#0A66C2" radius={[8, 8, 0, 0]}>
                {data.jobTitles.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Geography */}
      {data.geography && data.geography.length > 0 && (
        <div className="demo-section">
          <h2>Geographic Distribution</h2>
          <div className="geography-grid">
            {data.geography.slice(0, 10).map((geo) => (
              <div key={geo.country} className="geo-card">
                <div className="geo-country">{geo.country}</div>
                <div className="geo-count">{geo.count}</div>
                <div className="geo-percentage">{geo.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Industries */}
      {data.industries && data.industries.length > 0 && (
        <div className="demo-section">
          <h2>Industries Represented</h2>
          <div className="industries-grid">
            {data.industries.map((ind) => (
              <div key={ind.industry} className="industry-badge">
                <div className="industry-name">{ind.industry}</div>
                <div className="industry-percentage">{ind.percentage.toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
