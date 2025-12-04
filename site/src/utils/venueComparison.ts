/**
 * Venue comparison utility for visualizing reach
 * Helps creators understand their reach by comparing to famous venues
 */

// All venues organized by capacity for easy reference
const VENUES = {
  MADISON_SQUARE_GARDEN: { name: 'Madison Square Garden', capacity: 22000 },
  FENWAY_PARK: { name: 'Fenway Park', capacity: 37755 },
  YANKEE_STADIUM: { name: 'Yankee Stadium', capacity: 47309 },
  DODGER_STADIUM: { name: 'Dodger Stadium', capacity: 56000 },
  SOFI_STADIUM: { name: 'SoFi Stadium', capacity: 70240 },
  AT_T_STADIUM: { name: 'AT&T Stadium', capacity: 80000 },
  WEMBLEY_STADIUM: { name: 'Wembley Stadium', capacity: 90000 },
  COACHELLA: { name: 'Coachella', capacity: 125000 },
  TIMES_SQUARE: { name: 'Times Square', capacity: 300000 },
  GRAND_CENTRAL_TERMINAL: { name: 'Grand Central Terminal', capacity: 750000 },
};

export interface VenueComparison {
  venue: string;
  times: number;
}

/**
 * Get a venue comparison for a given reach number
 * Uses threshold-based matching: finds the appropriate venue at or below the reach
 * @param membersReached - The number of members reached
 * @returns Object with venue name and number of times it would fill, or null if too small
 */
export function getVenueComparison(membersReached: number): VenueComparison | null {
  // Smallest venue threshold - if below this, don't show comparison
  if (membersReached < VENUES.MADISON_SQUARE_GARDEN.capacity) {
    return null;
  }

  // Exclusive if statements - lowest numbers first
  if (membersReached >= VENUES.MADISON_SQUARE_GARDEN.capacity && membersReached < VENUES.FENWAY_PARK.capacity) {
    const times = Math.round((membersReached / VENUES.MADISON_SQUARE_GARDEN.capacity) * 10) / 10;
    return {
      venue: VENUES.MADISON_SQUARE_GARDEN.name,
      times,
    };
  }

  if (membersReached >= VENUES.FENWAY_PARK.capacity && membersReached < VENUES.YANKEE_STADIUM.capacity) {
    const times = Math.round((membersReached / VENUES.FENWAY_PARK.capacity) * 10) / 10;
    return {
      venue: VENUES.FENWAY_PARK.name,
      times,
    };
  }

  if (membersReached >= VENUES.YANKEE_STADIUM.capacity && membersReached < VENUES.DODGER_STADIUM.capacity) {
    const times = Math.round((membersReached / VENUES.YANKEE_STADIUM.capacity) * 10) / 10;
    return {
      venue: VENUES.YANKEE_STADIUM.name,
      times,
    };
  }

  if (membersReached >= VENUES.DODGER_STADIUM.capacity && membersReached < VENUES.SOFI_STADIUM.capacity) {
    const times = Math.round((membersReached / VENUES.DODGER_STADIUM.capacity) * 10) / 10;
    return {
      venue: VENUES.DODGER_STADIUM.name,
      times,
    };
  }

  if (membersReached >= VENUES.SOFI_STADIUM.capacity && membersReached < VENUES.AT_T_STADIUM.capacity) {
    const times = Math.round((membersReached / VENUES.SOFI_STADIUM.capacity) * 10) / 10;
    return {
      venue: VENUES.SOFI_STADIUM.name,
      times,
    };
  }

  if (membersReached >= VENUES.AT_T_STADIUM.capacity && membersReached < VENUES.WEMBLEY_STADIUM.capacity) {
    const times = Math.round((membersReached / VENUES.AT_T_STADIUM.capacity) * 10) / 10;
    return {
      venue: VENUES.AT_T_STADIUM.name,
      times,
    };
  }

  if (membersReached >= VENUES.WEMBLEY_STADIUM.capacity && membersReached < VENUES.COACHELLA.capacity) {
    const times = Math.round((membersReached / VENUES.WEMBLEY_STADIUM.capacity) * 10) / 10;
    return {
      venue: VENUES.WEMBLEY_STADIUM.name,
      times,
    };
  }

  if (membersReached >= VENUES.COACHELLA.capacity && membersReached < VENUES.TIMES_SQUARE.capacity) {
    const times = Math.round((membersReached / VENUES.COACHELLA.capacity) * 10) / 10;
    return {
      venue: VENUES.COACHELLA.name,
      times,
    };
  }

  if (membersReached >= VENUES.TIMES_SQUARE.capacity && membersReached < VENUES.GRAND_CENTRAL_TERMINAL.capacity) {
    const times = Math.round((membersReached / VENUES.TIMES_SQUARE.capacity) * 10) / 10;
    return {
      venue: VENUES.TIMES_SQUARE.name,
      times,
    };
  }

  // If larger than the largest single venue capacity, calculate times for Grand Central
  if (membersReached >= VENUES.GRAND_CENTRAL_TERMINAL.capacity) {
    const times = Math.round((membersReached / VENUES.GRAND_CENTRAL_TERMINAL.capacity) * 10) / 10;
    return {
      venue: VENUES.GRAND_CENTRAL_TERMINAL.name,
      times: Math.max(times, 1),
    };
  }

  return null;
}

/**
 * Format the venue comparison as a readable string
 * @param membersReached - The number of members reached
 * @returns Formatted string like "That's like filling Madison Square Garden 1.5 times" or null if too small
 */
export function formatVenueComparison(membersReached: number): string | null {
  const comparison = getVenueComparison(membersReached);

  if (!comparison) {
    return null;
  }

  if (comparison.times === 1) {
    return `That's like filling ${comparison.venue}`;
  }

  if (comparison.times >= 2 && comparison.times < 3) {
    return `That's like filling ${comparison.venue} twice`;
  }

  const flooredTimes = Math.floor(comparison.times);
  const formattedTimes = flooredTimes.toLocaleString('en-US');

  return `That's like filling ${comparison.venue} ${formattedTimes} times`;
}
