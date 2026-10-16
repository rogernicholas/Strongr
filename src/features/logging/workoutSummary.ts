import type { Workout } from '@/data';

/** i18n keys of the "good job" phrases; add or remove entries freely. */
export const PHRASES = [
  'done.phrase1',
  'done.phrase2',
  'done.phrase3',
  'done.phrase4',
  'done.phrase5',
  'done.phrase6',
  'done.phrase7',
  'done.phrase8',
  'done.phrase9',
  'done.phrase10',
  'done.phrase11',
  'done.phrase12',
  'done.phrase13',
  'done.phrase14',
  'done.phrase15',
] as const;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

/**
 * Picks the phrase for the n-th finished workout. Stepping by a number that shares
 * no factor with the count (7 for 15 phrases) visits every phrase once per round,
 * never the same one twice in a row, and needs no stored state.
 */
export function phraseIndex(finishedCount: number, count: number = PHRASES.length): number {
  let step = Math.max(1, Math.floor(count / 2));
  while (gcd(step, count) !== 1) step++;
  return (((finishedCount * step) % count) + count) % count;
}

export interface WorkoutSummary {
  durationMs: number;
  exercises: number;
  workingSets: number;
}

export function summarizeWorkout(workout: Workout): WorkoutSummary {
  const done = workout.exercises.filter((e) => e.sets.length > 0);
  return {
    durationMs: Math.max(0, (workout.endedAt ?? workout.startedAt) - workout.startedAt),
    exercises: done.length,
    workingSets: done.reduce((n, e) => n + e.sets.filter((s) => !s.isWarmup).length, 0),
  };
}
