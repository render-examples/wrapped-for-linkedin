import React from 'react';
import { Icon, type IconName } from '@components/Icon';
import '@styles/BadgeEmblem.css';

// The seal is a circle with a scalloped edge. Each scallop is an arc between two points on the circle.
const SEAL_CENTER_X = 50;
const SEAL_CENTER_Y = 44;
const SEAL_RADIUS = 38;
const SCALLOPS = 16;
const ICON_SIZE = 36;

function buildSealPath(): string {
  const points = Array.from({ length: SCALLOPS }, (_, i) => {
    const angle = (2 * Math.PI * i) / SCALLOPS - Math.PI / 2;
    return [
      SEAL_CENTER_X + SEAL_RADIUS * Math.cos(angle),
      SEAL_CENTER_Y + SEAL_RADIUS * Math.sin(angle),
    ].map((value) => value.toFixed(2));
  });
  const arcRadius = (SEAL_RADIUS * Math.sin(Math.PI / SCALLOPS) * 1.1).toFixed(2);
  const arcs = points
    .map((_, i) => {
      const [x, y] = points[(i + 1) % SCALLOPS];
      return `A ${arcRadius} ${arcRadius} 0 0 1 ${x} ${y}`;
    })
    .join(' ');
  return `M ${points[0][0]} ${points[0][1]} ${arcs} Z`;
}

const SEAL_PATH = buildSealPath();
const LEFT_RIBBON = 'M 30 64 L 18 116 L 31 106 L 40 118 L 48 76 Z';
const RIGHT_RIBBON = 'M 70 64 L 82 116 L 69 106 L 60 118 L 52 76 Z';

interface BadgeEmblemProps {
  icon: IconName;
  className?: string;
}

/**
 * An award badge: a scalloped seal with two ribbon tails and the badge icon in the center.
 * Set the width with `className`. The height is 1.2 times the width.
 */
export const BadgeEmblem: React.FC<BadgeEmblemProps> = ({ icon, className }) => (
  <div className={`badge-emblem ${className ?? ''}`} aria-hidden="true">
    {/* Colors use currentColor and attributes, because html-to-image drops CSS fill on SVG shapes. */}
    <svg className="badge-emblem-shape" viewBox="0 0 100 120" fill="currentColor">
      <path d={LEFT_RIBBON} />
      <path d={RIGHT_RIBBON} />
      {/* A white layer makes the ribbons a lighter purple than the seal. */}
      <path d={LEFT_RIBBON} fill="#fff" fillOpacity="0.45" />
      <path d={RIGHT_RIBBON} fill="#fff" fillOpacity="0.45" />
      <path d={SEAL_PATH} />
      <circle
        cx={SEAL_CENTER_X}
        cy={SEAL_CENTER_Y}
        r="29"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />
      {/* The icon is in the SVG, so its center is exactly on the seal center. */}
      <svg
        x={SEAL_CENTER_X - ICON_SIZE / 2}
        y={SEAL_CENTER_Y - ICON_SIZE / 2}
        width={ICON_SIZE}
        height={ICON_SIZE}
        color="#fff"
      >
        <Icon name={icon} />
      </svg>
    </svg>
  </div>
);
