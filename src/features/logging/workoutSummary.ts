import type { Workout } from '@/data';

export const PHRASE_COUNT = 15;

/**
 * Picks the phrase for the n-th finished workout. Stepping by 7 (which shares
 * no factor with 15) visits every phrase once per 15 workouts, never the same
 * one twice in a row, and needs no stored state.
 */
export function phraseIndex(finishedCount: number, count = PHRASE_COUNT): number {
  return (((finishedCount * 7) % count) + count) % count;
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
