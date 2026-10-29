import { weekStartKey } from '@/core/dates';
import { bodyweightFor, estimateCalories, workingSets, workoutLengthMs } from '@/core/training';
import type { Bodyweight, ExerciseSession, Workout } from '@/data';

import { defaultMetric, sessionValue } from './stats';

const WEEK = 7 * 24 * 60 * 60 * 1000;
/** Progress compares the average of this many first and last sessions. */
const ENDS = 2;
const MIN_SESSIONS = 4;

export interface ExerciseProgress {
  name: string;
  /** Change between the first and last sessions, as a fraction (0.086 = +8.6%). */
  change: number;
}

export interface Overview {
  workouts: number;
  perWeek: number | null;
  /** First to last logged set (start to Finish for one-set workouts). */
  avgDurationMs: number | null;
  /** Estimated kcal, from the bodyweight logged for each workout's week. */
  avgCalories: number | null;
  totalCalories: number | null;
  avgWorkingSets: number | null;
  /** From rests saved with Log rest. */
  avgRestS: number | null;
  biggest: ExerciseProgress | null;
  smallest: ExerciseProgress | null;
}

const mean = (values: readonly number[]) =>
  values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;

const lengthOf = (w: Workout) =>
  workoutLengthMs(
    w,
    w.exercises.flatMap((e) => e.sets),
  );

/**
 * Change in the exercise's chart metric (All sets score, or reps without weight)
 * between its first and last sessions. Null with too few sessions to tell.
 */
export function exerciseProgress(sessions: readonly ExerciseSession[]): number | null {
  const metric = defaultMetric(sessions);
  if (!metric) return null;
  const values = sessions.flatMap((s) => {
    const v = sessionValue(s.sets, metric);
    return v === null ? [] : [v];
  });
  if (values.length < MIN_SESSIONS) return null;
  const first = mean(values.slice(0, ENDS))!;
  const last = mean(values.slice(-ENDS))!;
  return first > 0 ? (last - first) / first : null;
}

/** Workout-wide stats for finished workouts (oldest first) started at or after `from`. */
export function summarizeOverview(
  all: readonly Workout[],
  bodyweights: readonly Bodyweight[],
  from: number,
  now: number,
): Overview {
  const workouts = all.filter((w) => w.startedAt >= from);
  const sets = workouts.flatMap((w) => w.exercises.flatMap((e) => e.sets));

  const first = workouts[0]?.startedAt;
  const weeks = first === undefined ? null : Math.max(1, (now - first) / WEEK);

  const byExercise = new Map<string, { name: string; sessions: ExerciseSession[] }>();
  for (const w of workouts) {
    for (const e of w.exercises) {
      if (workingSets(e.sets).length === 0) continue;
      const entry = byExercise.get(e.exerciseId) ?? { name: e.exerciseName, sessions: [] };
      entry.sessions.push({ workoutId: w.id, startedAt: w.startedAt, sets: e.sets });
      byExercise.set(e.exerciseId, entry);
    }
  }
  const ranked = [...byExercise.values()]
    .flatMap(({ name, sessions }) => {
      const change = exerciseProgress(sessions);
      return change === null ? [] : [{ name, change }];
    })
    .sort((a, b) => b.change - a.change);

  const calories = workouts.flatMap((w) => {
    const kg = bodyweightFor(bodyweights, weekStartKey(new Date(w.startedAt)));
    const ms = lengthOf(w);
    return kg === null || ms === null ? [] : [estimateCalories(kg, ms)];
  });

  return {
    workouts: workouts.length,
    perWeek: weeks === null ? null : workouts.length / weeks,
    avgDurationMs: mean(workouts.flatMap((w) => lengthOf(w) ?? [])),
    avgCalories: mean(calories),
    totalCalories: calories.length ? calories.reduce((a, b) => a + b, 0) : null,
    avgWorkingSets: mean(
      workouts.map((w) => workingSets(w.exercises.flatMap((e) => e.sets)).length),
    ),
    avgRestS: mean(sets.flatMap((s) => (s.restS === null ? [] : [s.restS]))),
    biggest: ranked[0] ?? null,
    smallest: ranked.length > 1 ? ranked[ranked.length - 1]! : null,
  };
}
