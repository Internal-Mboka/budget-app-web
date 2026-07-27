/** Capacité d'ouverture studio — base de calcul du taux d'occupation (US-47 / US-49). */
export const STUDIO_OPENING_HOURS_PER_DAY = 12;
export const STUDIO_ROOM_COUNT = 4;

export function estimateStudioCapacityHours(daysInPeriod: number): number {
  return daysInPeriod * STUDIO_OPENING_HOURS_PER_DAY * STUDIO_ROOM_COUNT;
}
