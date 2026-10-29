import { sessionChange, workingSets, workoutCalories, workoutLengthMs } from '@/core/training';
import type { LoggedSet, Workout } from '@/data';

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
  /** Estimate from bodyweight and length; null without a bodyweight entry. */
  calories: number | null;
  exercises: number;
  workingSets: number;
}

export function summarizeWorkout(workout: Workout, bodyweightKg: number | null): WorkoutSummary {
  const done = workout.exercises.filter((e) => e.sets.length > 0);
  const durationMs =
    workoutLengthMs(
      workout,
      done.flatMap((e) => e.sets),
    ) ?? 0;
  return {
    durationMs,
    calories: bodyweightKg === null ? null : workoutCalories(bodyweightKg, workout),
    exercises: done.length,
    workingSets: done.reduce((n, e) => n + e.sets.filter((s) => !s.isWarmup).length, 0),
  };
}

export interface ExerciseProgression {
  name: string;
  /** Change against the previous session as a fraction; null for a first session or no match. */
  change: number | null;
  first: boolean;
}

/** One line per exercise with working sets: how it compares with its previous session. */
export function exerciseProgression(
  workout: Workout,
  previous: Readonly<Record<string, readonly LoggedSet[]>>,
): ExerciseProgression[] {
  return workout.exercises
    .filter((e) => workingSets(e.sets).length > 0)
    .map((e) => {
      const before = previous[e.exerciseId] ?? [];
      return {
        name: e.exerciseName,
        change: sessionChange(e.sets, before),
        first: workingSets(before).length === 0,
      };
    });
}
