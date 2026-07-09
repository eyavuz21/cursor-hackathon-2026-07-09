/** Average urban walking pace (~5 km/h). */
export const WALKING_SPEED_M_PER_MIN = 5000 / 60;

/** Hard cap for health-optimised journal routes. */
export const MAX_WALK_MINUTES = 60;

/** Rough steps per metre walked. */
export const STEPS_PER_METER = 1.3;

/** Buffer reserved for arrival flexibility. */
export const WALK_TIME_BUFFER_MINUTES = 5;

export function estimateWalkMinutes(distanceMeters: number): number {
  return distanceMeters / WALKING_SPEED_M_PER_MIN;
}

export function estimateSteps(distanceMeters: number): number {
  return Math.round(distanceMeters * STEPS_PER_METER);
}

export function formatWalkDuration(minutes: number): string {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return mins > 0 ? `~${hours}h ${mins}m` : `~${hours}h`;
}
