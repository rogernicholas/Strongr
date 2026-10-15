export const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

export function isMuscleGroup(value: unknown): value is MuscleGroup {
  return MUSCLE_GROUPS.includes(value as MuscleGroup);
}
