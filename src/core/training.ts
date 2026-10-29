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
