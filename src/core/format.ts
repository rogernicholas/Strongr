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
 * Text for one set that says what each number is, e.g. "50 kg × 7 reps", "12 reps"
 * (bodyweight), "1:30", "2 km · 8:00". `reps` words a rep count, e.g. via i18n plurals.
 */
export function formatSetShort(
  set: SetValues,
  unit: WeightUnit,
  reps: (count: number) => string,
): string {
  const parts: string[] = [];
  const weight =
    set.weightKg === null
      ? null
      : `${formatNumber(toDisplayWeight(set.weightKg, unit), 2)} ${unit}`;
  if (weight !== null && set.reps !== null) parts.push(`${weight} × ${reps(set.reps)}`);
  else if (set.reps !== null) parts.push(reps(set.reps));
  else if (weight !== null) parts.push(weight);
  if (set.distanceM !== null) parts.push(formatDistance(set.distanceM));
  if (set.durationS !== null) parts.push(formatDuration(set.durationS));
  return parts.join(' · ');
}
