import { workingSets } from '@/core/training';
import { formatNumber, toDisplayWeight, type WeightUnit } from '@/core/units';
import type { Workout } from '@/data';

import { weightStep } from './setEntry';

/** At most this many lines, so the good-job screen never nags. */
const MAX_SUGGESTIONS = 2;

export interface WeightSuggestion {
  exerciseName: string;
  /** The next weight, in the user's unit, e.g. "62.5 kg". */
  next: string;
}

/**
 * Exercises where every working set at the heaviest weight reached `targetReps`:
 * suggests one plate step more (2.5 kg or 5 lb) for next time.
 */
export function suggestWeightIncreases(
  workout: Workout,
  targetReps: number,
  unit: WeightUnit,
): WeightSuggestion[] {
  const suggestions: WeightSuggestion[] = [];
  for (const exercise of workout.exercises) {
    const sets = workingSets(exercise.sets).filter((s) => s.weightKg !== null && s.reps !== null);
    if (sets.length === 0) continue;
    const top = Math.max(...sets.map((s) => s.weightKg!));
    if (!(top > 0) || !sets.filter((s) => s.weightKg === top).every((s) => s.reps! >= targetReps))
      continue;
    const next = toDisplayWeight(top, unit) + weightStep(unit);
    suggestions.push({
      exerciseName: exercise.exerciseName,
      next: `${formatNumber(next, 2)} ${unit}`,
    });
    if (suggestions.length === MAX_SUGGESTIONS) break;
  }
  return suggestions;
}
