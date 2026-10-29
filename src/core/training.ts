/**
 * Training maths shared by logging and progress. Pure functions on plain set values;
 * weights are canonical kg. Warm-up sets never count.
 */

export interface TrainingSet {
  weightKg: number | null;
  reps: number | null;
  isWarmup: boolean;
}

export function workingSets<T extends TrainingSet>(sets: readonly T[]): T[] {
  return sets.filter((s) => !s.isWarmup);
}

/** Estimated one-rep max (Epley). A single rep is the weight itself. */
export function estimate1Rm(weightKg: number, reps: number): number | null {
  if (!(weightKg > 0) || !(reps > 0)) return null;
  return reps === 1 ? weightKg : weightKg * (1 + reps / 30);
}

function setE1rms(sets: readonly TrainingSet[]): number[] {
  return workingSets(sets).flatMap((s) => {
    const e = s.weightKg !== null && s.reps !== null ? estimate1Rm(s.weightKg, s.reps) : null;
    return e === null ? [] : [e];
  });
}

/** The best estimated 1RM among a session's working sets. */
export function bestE1rm(sets: readonly TrainingSet[]): number | null {
  const all = setE1rms(sets);
  return all.length ? Math.max(...all) : null;
}

/**
 * "All sets" score: the average estimated 1RM over a session's working sets.
 * Holding 12 reps on every set scores higher than 12 reps once and then fading,
 * and doing one extra set doesn't inflate it the way volume does.
 */
export function allSetsScore(sets: readonly TrainingSet[]): number | null {
  const all = setE1rms(sets);
  return all.length ? all.reduce((a, b) => a + b, 0) / all.length : null;
}

/** Total kg lifted in working sets (weight × reps). Null when no set has both. */
export function sessionVolume(sets: readonly TrainingSet[]): number | null {
  const lifted = workingSets(sets).filter((s) => s.weightKg !== null && s.reps !== null);
  return lifted.length ? lifted.reduce((n, s) => n + s.weightKg! * s.reps!, 0) : null;
}

/**
 * Score used to compare sessions of one exercise: the All sets score when weight and
 * reps were logged, otherwise most reps in a working set (bodyweight exercises).
 */
export function sessionScore(
  sets: readonly TrainingSet[],
): { kind: 'allSets' | 'reps'; value: number } | null {
  const score = allSetsScore(sets);
  if (score !== null) return { kind: 'allSets', value: score };
  const reps = workingSets(sets).flatMap((s) => (s.reps === null ? [] : [s.reps]));
  return reps.length ? { kind: 'reps', value: Math.max(...reps) } : null;
}

/** Change from `before` to `now` as a fraction (0.042 = +4.2%); null when not comparable. */
export function sessionChange(
  now: readonly TrainingSet[],
  before: readonly TrainingSet[],
): number | null {
  const a = sessionScore(before);
  const b = sessionScore(now);
  if (!a || !b || a.kind !== b.kind || !(a.value > 0)) return null;
  return (b.value - a.value) / a.value;
}

/**
 * Workout length from the first to the last set logged live. Null with fewer than two
 * timed sets. Forgetting to tap Finish can't stretch it.
 */
export function activeDurationMs(sets: readonly { completedAt: number | null }[]): number | null {
  const times = sets.flatMap((s) => (s.completedAt === null ? [] : [s.completedAt]));
  return times.length >= 2 ? Math.max(...times) - Math.min(...times) : null;
}

/**
 * A workout's length: first to last live set, or start to Finish when fewer than two
 * sets were timed. Null for an unfinished workout without two timed sets.
 */
export function workoutLengthMs(
  workout: { startedAt: number; endedAt: number | null },
  sets: readonly { completedAt: number | null }[],
): number | null {
  const active = activeDurationMs(sets);
  if (active !== null) return active;
  return workout.endedAt === null ? null : Math.max(0, workout.endedAt - workout.startedAt);
}

/** MET for weightlifting with multiple sets (Compendium of Physical Activities). */
export const STRENGTH_MET = 5;

/** Estimated kcal burned: MET × bodyweight (kg) × hours. */
export function estimateCalories(bodyweightKg: number, durationMs: number): number {
  return STRENGTH_MET * bodyweightKg * (durationMs / 3_600_000);
}

/**
 * Bodyweight for a workout: the latest weekly entry for its week or before; if there is
 * none that early, the first entry ever. Entries are { weekStart: 'YYYY-MM-DD', weightKg }.
 */
export function bodyweightFor(
  entries: readonly { weekStart: string; weightKg: number }[],
  weekStart: string,
): number | null {
  const sorted = [...entries].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const before = sorted.filter((e) => e.weekStart <= weekStart).at(-1);
  return (before ?? sorted[0])?.weightKg ?? null;
}
