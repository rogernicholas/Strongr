import { MUSCLE_GROUPS, type MuscleGroup } from '@/config/muscleGroups';
import type { Exercise } from '@/data';

export interface ExerciseSection {
  key: MuscleGroup | 'other';
  data: Exercise[];
}

function normalize(text: string): string {
  return text.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

/** Groups exercises by muscle group in a fixed order, filtered by a search query. */
export function groupExercises(exercises: readonly Exercise[], query = ''): ExerciseSection[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const matches = exercises.filter((e) => {
    const name = normalize(e.name);
    return words.every((w) => name.includes(w));
  });

  const keys: ExerciseSection['key'][] = [...MUSCLE_GROUPS, 'other'];
  return keys
    .map((key) => ({
      key,
      data: matches
        .filter((e) => (e.muscleGroup ?? 'other') === key)
        .sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .filter((section) => section.data.length > 0);
}
