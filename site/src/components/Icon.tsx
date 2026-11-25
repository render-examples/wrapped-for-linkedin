import React from 'react';
import {
  Briefcase,
  CalendarBlank,
  Confetti,
  Diamond,
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

// Data files keep icon names as strings. This map turns a name into an icon.
const ICONS = {
  briefcase: Briefcase,
  calendar: CalendarBlank,
  confetti: Confetti,
  diamond: Diamond,
  fire: Fire,
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
