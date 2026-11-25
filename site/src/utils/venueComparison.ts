/**
 * Compare a reach number to the capacity of a well-known venue.
 */

// Sorted by capacity, smallest first.
const VENUES = [
  { name: 'Madison Square Garden', capacity: 22000 },
  { name: 'Fenway Park', capacity: 37755 },
  { name: 'Yankee Stadium', capacity: 47309 },
  { name: 'Dodger Stadium', capacity: 56000 },
  { name: 'SoFi Stadium', capacity: 70240 },
  { name: 'AT&T Stadium', capacity: 80000 },
  { name: 'Wembley Stadium', capacity: 90000 },
  { name: 'Coachella', capacity: 125000 },
  { name: 'Times Square', capacity: 300000 },
  { name: 'Grand Central Terminal', capacity: 750000 },
] as const;

interface VenueComparison {
  venue: string;
  // How many whole times the reach fills the venue.
  times: number;
}

/**
 * Find the largest venue that the reach fills at least once.
 * @returns The venue and how many times the reach fills it, or null if the reach is below the smallest venue.
 */
function getVenueComparison(membersReached: number): VenueComparison | null {
  const venue = [...VENUES].reverse().find((v) => membersReached >= v.capacity);
  if (!venue) {
    return null;
  }

  return {
    venue: venue.name,
    times: Math.floor(membersReached / venue.capacity),
  };
}

/**
 * @returns A sentence such as "That's like filling Fenway Park twice", or null if the reach is below the smallest venue.
 */
export function formatVenueComparison(membersReached: number): string | null {
  const comparison = getVenueComparison(membersReached);

  if (!comparison) {
    return null;
  }

  const { venue, times } = comparison;
  const prefix = `That's like filling ${venue}`;

  if (times === 1) {
    return prefix;
  }

  if (times === 2) {
    return `${prefix} twice`;
  }

  return `${prefix} ${times.toLocaleString('en-US')} times`;
}
