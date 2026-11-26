import React from 'react';
import {
  Briefcase,
  CalendarBlank,
  Confetti,
  Fire,
  Handshake,
  IconBase,
  PushPin,
  RocketLaunch,
  Sparkle,
  Trophy,
  UsersThree,
  WarningCircle,
  X,
  XCircle,
  type Icon as PhosphorIcon,
  type IconWeight,
} from '@phosphor-icons/react';

// Phosphor has no thought bubble, so this draws one on the Phosphor 256 by 256 grid.
// It is a cloud with two small circles that trail to the lower left. Only the fill weight is used.
const THOUGHT_BUBBLE_WEIGHTS = new Map<IconWeight, React.ReactElement>([
  [
    'fill',
    <>
      <circle cx="100" cy="110" r="42" />
      <circle cx="150" cy="82" r="52" />
      <circle cx="200" cy="112" r="40" />
      <circle cx="152" cy="134" r="46" />
      <circle cx="108" cy="142" r="32" />
      <circle cx="196" cy="144" r="30" />
      <circle cx="62" cy="194" r="16" />
      <circle cx="32" cy="226" r="10" />
    </>,
  ],
]);

const ThoughtBubble: PhosphorIcon = React.forwardRef((props, ref) => (
  <IconBase ref={ref} {...props} weights={THOUGHT_BUBBLE_WEIGHTS} />
));
ThoughtBubble.displayName = 'ThoughtBubble';

// Phosphor has no cut gem, so this draws one on the Phosphor 256 by 256 grid.
// The facets are the icon color at different opacities, and the outline and facet edges are solid lines.
const GEM_FACETS: [points: string, opacity: number][] = [
  ['20,100 68,40 88,100', 0.7],
  ['68,40 128,40 88,100', 0.45],
  ['128,40 168,100 88,100', 0.7],
  ['128,40 188,40 168,100', 0.45],
  ['188,40 236,100 168,100', 0.7],
  ['20,100 88,100 128,220', 0.2],
  ['88,100 168,100 128,220', 0.45],
  ['168,100 236,100 128,220', 0.2],
];
const GEM_EDGES =
  'M 68 40 L 188 40 L 236 100 L 128 220 L 20 100 Z M 20 100 L 236 100 ' +
  'M 68 40 L 88 100 L 128 220 L 168 100 L 188 40 M 88 100 L 128 40 L 168 100';

const GEM_WEIGHTS = new Map<IconWeight, React.ReactElement>([
  [
    'fill',
    <>
      {GEM_FACETS.map(([points, opacity]) => (
        <polygon key={points} points={points} fillOpacity={opacity} />
      ))}
      <path
        d={GEM_EDGES}
        fill="none"
        stroke="currentColor"
        strokeWidth="14"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </>,
  ],
]);

const Gem: PhosphorIcon = React.forwardRef((props, ref) => (
  <IconBase ref={ref} {...props} weights={GEM_WEIGHTS} />
));
Gem.displayName = 'Gem';

// Data files keep icon names as strings. This map turns a name into an icon.
const ICONS = {
  briefcase: Briefcase,
  calendar: CalendarBlank,
  confetti: Confetti,
  fire: Fire,
  gem: Gem,
  handshake: Handshake,
  pin: PushPin,
  rocket: RocketLaunch,
  sparkle: Sparkle,
  thought: ThoughtBubble,
  trophy: Trophy,
  users: UsersThree,
  warning: WarningCircle,
  close: X,
  error: XCircle,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  className?: string;
}

/**
 * A solid icon in the current text color. It fills its parent, so set the size on the parent.
 */
export const Icon: React.FC<IconProps> = ({ name, className }) => {
  const Component = ICONS[name];
  return (
    <Component weight="fill" width="100%" height="100%" className={className} aria-hidden="true" />
  );
};
