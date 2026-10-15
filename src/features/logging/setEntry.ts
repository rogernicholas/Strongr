import type { LoggedSet, SetInput } from '@/data';
import type { WeightUnit } from '@/core/units';

export const EMPTY_SET: SetInput = {
  weightKg: null,
  reps: null,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup: false,
};

/**
 * What the input fields start with for the next set: the previous set of this
 * session ("copy previous set"), otherwise the same set number from last time.
 */
export function suggestNextSet(
  sessionSets: readonly LoggedSet[],
  previousSets: readonly LoggedSet[],
): SetInput {
  const source =
    sessionSets.at(-1) ?? previousSets.filter((s) => !s.isWarmup)[0] ?? previousSets[0];
  if (!source) return EMPTY_SET;
  const { id: _id, position: _position, ...values } = source;
  return { ...values, isWarmup: sessionSets.length === 0 ? false : values.isWarmup };
}

/** Accepts "52.5" and "52,5". Returns null for empty or invalid input. */
export function parseDecimal(text: string): number | null {
  const clean = text.trim().replace(',', '.');
  if (clean === '') return null;
  const value = Number(clean);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function parseWholeNumber(text: string): number | null {
  const value = parseDecimal(text);
  return value === null ? null : Math.round(value);
}

/** Plate-friendly increment for the +/- buttons. */
export function weightStep(unit: WeightUnit): number {
  return unit === 'kg' ? 2.5 : 5;
}
