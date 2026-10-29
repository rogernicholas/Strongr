import { CARDIO, isMuscleGroup, type MuscleGroup } from '@/config/muscleGroups';
import type { SeedExercise } from '@/config/seedExercises';
import { systemClock, type Clock } from '@/core/clock';
import type { Db } from '@/core/db';
import { newId } from '@/core/id';

export interface Exercise {
  id: string;
  name: string;
  source: 'seed' | 'custom';
  muscleGroup: MuscleGroup | null;
  tracks: { weight: boolean; reps: boolean; time: boolean; distance: boolean };
}

interface ExerciseRow {
  id: string;
  name: string;
  source: 'seed' | 'custom';
  muscle_group: string | null;
  tracks_weight: number;
  tracks_reps: number;
  tracks_time: number;
  tracks_distance: number;
}

const COLUMNS =
  'id, name, source, muscle_group, tracks_weight, tracks_reps, tracks_time, tracks_distance';

function toExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    source: row.source,
    muscleGroup: isMuscleGroup(row.muscle_group) ? row.muscle_group : null,
    tracks: {
      weight: row.tracks_weight === 1,
      reps: row.tracks_reps === 1,
      time: row.tracks_time === 1,
      distance: row.tracks_distance === 1,
    },
  };
}

const flag = (value: boolean | undefined, fallback: boolean) => ((value ?? fallback) ? 1 : 0);

export class DuplicateExerciseError extends Error {
  constructor(readonly name: string) {
    super(`An exercise called "${name}" already exists.`);
    this.name = 'DuplicateExerciseError';
  }
}

export function createExerciseRepository(db: Db, clock: Clock = systemClock) {
  return {
    async list(): Promise<Exercise[]> {
      const rows = await db.getAll<ExerciseRow>(
        `SELECT ${COLUMNS} FROM exercises WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE`,
      );
      return rows.map(toExercise);
    },

    async create(input: { name: string; muscleGroup: MuscleGroup }): Promise<Exercise> {
      const name = input.name.trim().replace(/\s+/g, ' ');
      if (!name) throw new Error('Exercise name is required.');
      const existing = await db.getFirst(
        'SELECT id FROM exercises WHERE deleted_at IS NULL AND name = ? COLLATE NOCASE',
        [name],
      );
      if (existing) throw new DuplicateExerciseError(name);

      const id = newId();
      const now = clock();
      // Cardio logs time and distance; everything else weight and reps.
      const cardio = input.muscleGroup === CARDIO ? 1 : 0;
      await db.run(
        `INSERT INTO exercises (id, name, source, muscle_group,
           tracks_weight, tracks_reps, tracks_time, tracks_distance, created_at, updated_at)
         VALUES (?, ?, 'custom', ?, ?, ?, ?, ?, ?, ?)`,
        [id, name, input.muscleGroup, 1 - cardio, 1 - cardio, cardio, cardio, now, now],
      );
      const row = await db.getFirst<ExerciseRow>(`SELECT ${COLUMNS} FROM exercises WHERE id = ?`, [
        id,
      ]);
      return toExercise(row!);
    },

    /**
     * Inserts seed exercises that aren't in the database yet. Never updates or
     * re-creates existing rows (including soft-deleted ones), so user edits win.
     */
    async syncSeeds(seeds: readonly SeedExercise[]): Promise<number> {
      const rows = await db.getAll<{ seed_key: string }>(
        'SELECT seed_key FROM exercises WHERE seed_key IS NOT NULL',
      );
      const known = new Set(rows.map((r) => r.seed_key));
      const missing = seeds.filter((s) => !known.has(s.key));
      if (missing.length === 0) return 0;

      const now = clock();
      await db.transaction(async () => {
        for (const seed of missing) {
          const t = seed.tracks ?? {};
          await db.run(
            `INSERT INTO exercises (id, name, source, seed_key, muscle_group,
               tracks_weight, tracks_reps, tracks_time, tracks_distance, created_at, updated_at)
             VALUES (?, ?, 'seed', ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              newId(),
              seed.name,
              seed.key,
              seed.muscleGroup,
              flag(t.weight, true),
              flag(t.reps, true),
              flag(t.time, false),
              flag(t.distance, false),
              now,
              now,
            ],
          );
        }
      });
      return missing.length;
    },
  };
}

export type ExerciseRepository = ReturnType<typeof createExerciseRepository>;
