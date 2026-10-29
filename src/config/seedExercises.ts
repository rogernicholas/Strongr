import type { MuscleGroup } from './muscleGroups';

export interface SeedExercise {
  /** Stable forever: links a database row to this entry. Never rename a key. */
  key: string;
  name: string;
  muscleGroup: MuscleGroup;
  /** Defaults to weight + reps. */
  tracks?: { weight?: boolean; reps?: boolean; time?: boolean; distance?: boolean };
  /**
   * Cardio energy for calorie estimates: MET from the Compendium of Physical Activities,
   * and for running, kcal per kg per km (used when a distance is logged).
   */
  energy?: { met: number; kcalPerKgKm?: number };
}

const CARDIO_TRACKS = { weight: false, reps: false, time: true, distance: true };

/**
 * Exercises every install starts with. New entries are added on the next app
 * start; edits users make to seeded exercises are never overwritten.
 */
export const seedExercises: readonly SeedExercise[] = [
  // Chest
  { key: 'bench_press', name: 'Bench press', muscleGroup: 'chest' },
  { key: 'incline_bench_press', name: 'Incline bench press', muscleGroup: 'chest' },
  { key: 'dumbbell_bench_press', name: 'Dumbbell bench press', muscleGroup: 'chest' },
  { key: 'incline_dumbbell_press', name: 'Incline dumbbell press', muscleGroup: 'chest' },
  { key: 'incline_press_machine', name: 'Incline press machine', muscleGroup: 'chest' },
  { key: 'chest_press_machine', name: 'Chest press machine', muscleGroup: 'chest' },
  { key: 'cable_fly', name: 'Cable fly', muscleGroup: 'chest' },
  { key: 'dips', name: 'Dips', muscleGroup: 'chest' },
  { key: 'push_up', name: 'Push-up', muscleGroup: 'chest' },

  // Back
  { key: 'barbell_row', name: 'Bent-over row (barbell)', muscleGroup: 'back' },
  { key: 'machine_row', name: 'Row machine', muscleGroup: 'back' },
  { key: 'cable_row', name: 'Cable row', muscleGroup: 'back' },
  { key: 'dumbbell_row', name: 'One-arm dumbbell row', muscleGroup: 'back' },
  { key: 't_bar_row', name: 'T-bar row', muscleGroup: 'back' },
  { key: 'lat_pulldown', name: 'Lat pulldown', muscleGroup: 'back' },
  { key: 'pull_up', name: 'Pull-up', muscleGroup: 'back' },
  { key: 'chin_up', name: 'Chin-up', muscleGroup: 'back' },
  { key: 'deadlift', name: 'Deadlift', muscleGroup: 'back' },

  // Shoulders
  { key: 'overhead_press', name: 'Overhead press (barbell)', muscleGroup: 'shoulders' },
  { key: 'dumbbell_shoulder_press', name: 'Dumbbell shoulder press', muscleGroup: 'shoulders' },
  { key: 'lateral_raise', name: 'Lateral raise', muscleGroup: 'shoulders' },
  { key: 'face_pull', name: 'Face pull', muscleGroup: 'shoulders' },
  { key: 'rear_delt_fly', name: 'Rear delt fly', muscleGroup: 'shoulders' },
  { key: 'shrug', name: 'Shrug', muscleGroup: 'shoulders' },

  // Arms
  { key: 'dumbbell_curl', name: 'Biceps curl (dumbbell)', muscleGroup: 'arms' },
  { key: 'barbell_curl', name: 'Barbell curl', muscleGroup: 'arms' },
  { key: 'hammer_curl', name: 'Hammer curl', muscleGroup: 'arms' },
  { key: 'triceps_pushdown', name: 'Triceps pushdown', muscleGroup: 'arms' },
  { key: 'overhead_triceps_extension', name: 'Overhead triceps extension', muscleGroup: 'arms' },
  { key: 'skull_crusher', name: 'Skull crusher', muscleGroup: 'arms' },

  // Legs
  { key: 'squat', name: 'Squat', muscleGroup: 'legs' },
  { key: 'leg_press', name: 'Leg press', muscleGroup: 'legs' },
  { key: 'romanian_deadlift', name: 'Romanian deadlift', muscleGroup: 'legs' },
  { key: 'leg_extension', name: 'Leg extension', muscleGroup: 'legs' },
  { key: 'leg_curl', name: 'Leg curl', muscleGroup: 'legs' },
  { key: 'lunge', name: 'Lunge', muscleGroup: 'legs' },
  { key: 'hip_thrust', name: 'Hip thrust', muscleGroup: 'legs' },
  { key: 'calf_raise', name: 'Calf raise', muscleGroup: 'legs' },

  // Core
  {
    key: 'plank',
    name: 'Plank',
    muscleGroup: 'core',
    tracks: { weight: false, reps: false, time: true },
  },
  {
    key: 'hanging_leg_raise',
    name: 'Hanging leg raise',
    muscleGroup: 'core',
    tracks: { weight: false },
  },
  { key: 'cable_crunch', name: 'Cable crunch', muscleGroup: 'core' },
  { key: 'ab_wheel', name: 'Ab wheel', muscleGroup: 'core', tracks: { weight: false } },

  // Cardio
  ...(
    [
      ['treadmill_run', 'Running (treadmill)', { met: 9.8, kcalPerKgKm: 1 }],
      ['outdoor_run', 'Running (outdoor)', { met: 9.8, kcalPerKgKm: 1 }],
      ['walking', 'Walking', { met: 3.5 }],
      ['incline_walk', 'Incline walk', { met: 6 }],
      ['stationary_bike', 'Stationary bike', { met: 7 }],
      ['rowing_erg', 'Rowing (erg)', { met: 7 }],
      ['elliptical', 'Elliptical', { met: 5 }],
      ['stair_climber', 'Stair climber', { met: 9 }],
      ['jump_rope', 'Jump rope', { met: 11.8 }],
    ] as const
  ).map(([key, name, energy]): SeedExercise => ({
    key,
    name,
    muscleGroup: 'cardio',
    tracks: CARDIO_TRACKS,
    energy,
  })),
];

const ENERGY = new Map(seedExercises.flatMap((s) => (s.energy ? [[s.key, s.energy]] : [])));

/** Cardio energy of a seeded exercise, if it has one. */
export function seedEnergy(key: string | null): SeedExercise['energy'] {
  return key === null ? undefined : ENERGY.get(key);
}
