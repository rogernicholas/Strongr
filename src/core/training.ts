import { CARDIO } from '@/config/muscleGroups';
import { seedEnergy } from '@/config/seedExercises';

/**
 * Training maths shared by logging and progress. Pure functions on plain set values;
 * weights are canonical kg. Warm-up sets never count.
 */

/**
 * Longest gap between two sets of the same exercise that counts as rest. Longer gaps
 * (a phone call, a chat) are left out of rest stats.
 */
export const MAX_REST_S = 5 * 60;

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

/** A set as sessionScore sees it; distance and time are optional for lifting-only callers. */
type ScoredSet = TrainingSet & { durationS?: number | null; distanceM?: number | null };

/**
 * Score used to compare sessions of one exercise: the All sets score when weight and
 * reps were logged, otherwise most reps in a working set (bodyweight exercises), then
 * total distance or time (cardio, planks).
 */
export function sessionScore(
  sets: readonly ScoredSet[],
): { kind: 'allSets' | 'reps' | 'distance' | 'time'; value: number } | null {
  const score = allSetsScore(sets);
  if (score !== null) return { kind: 'allSets', value: score };
  const w = workingSets(sets);
  const reps = w.flatMap((s) => (s.reps === null ? [] : [s.reps]));
  if (reps.length) return { kind: 'reps', value: Math.max(...reps) };
  // Cardio and timed holds: total distance, else total time.
  const sum = (values: (number | null)[]) => values.reduce<number>((n, v) => n + (v ?? 0), 0);
  const distance = sum(w.map((s) => s.distanceM ?? null));
  if (distance > 0) return { kind: 'distance', value: distance };
  const time = sum(w.map((s) => s.durationS ?? null));
  return time > 0 ? { kind: 'time', value: time } : null;
}

/** Change from `before` to `now` as a fraction (0.042 = +4.2%); null when not comparable. */
export function sessionChange(
  now: readonly ScoredSet[],
  before: readonly ScoredSet[],
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
/** MET for a cardio exercise the user added themselves (moderate effort). */
export const CUSTOM_CARDIO_MET = 7;

/** Estimated kcal burned: MET × bodyweight (kg) × hours. */
export function estimateCalories(
  bodyweightKg: number,
  durationMs: number,
  met: number = STRENGTH_MET,
): number {
  return met * bodyweightKg * (durationMs / 3_600_000);
}

interface EnergySet {
  durationS: number | null;
  distanceM: number | null;
  completedAt: number | null;
}

export interface EnergyWorkout {
  startedAt: number;
  endedAt: number | null;
  exercises: readonly {
    seedKey: string | null;
    muscleGroup: string | null;
    sets: readonly EnergySet[];
  }[];
}

/**
 * Estimated kcal for a workout. Each cardio set counts with its exercise's own MET over
 * its logged time (or, for running with a distance, kcal per kg per km). The rest of the
 * workout's length counts as lifting at MET 5; a cardio-only workout has no lifting part.
 */
export function workoutCalories(bodyweightKg: number, workout: EnergyWorkout): number {
  const done = workout.exercises.filter((e) => e.sets.length > 0);
  const length =
    workoutLengthMs(
      workout,
      done.flatMap((e) => e.sets),
    ) ?? 0;
  let kcal = 0;
  let cardioMs = 0;
  for (const exercise of done) {
    if (exercise.muscleGroup !== CARDIO) continue;
    const energy = seedEnergy(exercise.seedKey) ?? { met: CUSTOM_CARDIO_MET };
    for (const set of exercise.sets) {
      const ms = (set.durationS ?? 0) * 1000;
      cardioMs += ms;
      kcal +=
        energy.kcalPerKgKm && set.distanceM
          ? energy.kcalPerKgKm * bodyweightKg * (set.distanceM / 1000)
          : estimateCalories(bodyweightKg, ms, energy.met);
    }
  }
  const lifting = done.some((e) => e.muscleGroup !== CARDIO);
  return kcal + (lifting ? estimateCalories(bodyweightKg, Math.max(0, length - cardioMs)) : 0);
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
