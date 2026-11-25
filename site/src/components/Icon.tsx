import React from 'react';
import {
  Briefcase,
  CalendarBlank,
  Confetti,
  Diamond,
  Fire,
  Handshake,
  PushPin,
  RocketLaunch,
  Sparkle,
  Trophy,
  UsersThree,
  WarningCircle,
  X,
  XCircle,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

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
