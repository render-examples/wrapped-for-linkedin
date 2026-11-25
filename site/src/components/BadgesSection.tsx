import React from "react";
import type { Badge } from "@utils/badges";
import { BadgeEmblem } from "@components/BadgeEmblem";
import "@styles/SpotifyDashboard.css";
import "@styles/BadgesSection.css";

interface BadgesSectionProps {
  badges: Badge[];
}

/**
 * Show the badges the user earned. Renders nothing if they earned none.
 */
export const BadgesSection: React.FC<BadgesSectionProps> = ({ badges }) => {
  if (badges.length === 0) {
    return null;
  }

  // 4 badges show as 2 rows of 2. 5 badges show as a row of 3 and a row of 2. Fewer badges show in one row.
  const columns = badges.length === 4 ? 2 : Math.min(badges.length, 3);

  return (
    <section className="wrapped-section badges-section">
      <p className="section-eyebrow">Badges</p>
      <h2 className="section-title">Add these to your headline</h2>
      <div
        className="wrapped-metrics-grid badges-grid"
        style={{ "--badge-columns": columns } as React.CSSProperties}
      >
        {badges.map((badge) => (
          <div key={badge.id} className="metric-card badge-card">
            <BadgeEmblem icon={badge.icon} className="badge-art" />
            <div className="badge-text">
              <h3 className="badge-name">{badge.name}</h3>
              <p className="badge-rule">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
