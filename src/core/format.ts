import { formatNumber, toDisplayWeight, type WeightUnit } from './units';

export interface SetValues {
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
}

/** "1:30" for 90 seconds, "45 s" under a minute. */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, '0')}`;
}

export function formatDistance(meters: number): string {
  return meters >= 1000 ? `${formatNumber(meters / 1000, 2)} km` : `${formatNumber(meters, 0)} m`;
}

/**
 * Compact text for one set, e.g. "50 × 7", "× 12" (bodyweight), "1:30",
 * "2 km in 8:00". Weight is shown in the user's unit without the unit label.
 */
export function formatSetShort(set: SetValues, unit: WeightUnit): string {
  const parts: string[] = [];
  if (set.weightKg !== null && set.reps !== null) {
    parts.push(`${formatNumber(toDisplayWeight(set.weightKg, unit), 2)} × ${set.reps}`);
  } else if (set.reps !== null) {
    parts.push(`× ${set.reps}`);
  } else if (set.weightKg !== null) {
    parts.push(`${formatNumber(toDisplayWeight(set.weightKg, unit), 2)} ${unit}`);
  }
  if (set.distanceM !== null) parts.push(formatDistance(set.distanceM));
  if (set.durationS !== null) parts.push(formatDuration(set.durationS));
  return parts.join(' · ');
}
