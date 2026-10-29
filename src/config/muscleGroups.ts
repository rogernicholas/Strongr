export const MUSCLE_GROUPS = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
] as const;

/** Cardio exercises log time and distance instead of weight and reps. */
export const CARDIO: MuscleGroup = 'cardio';

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return MUSCLE_GROUPS.includes(value as MuscleGroup);
}
