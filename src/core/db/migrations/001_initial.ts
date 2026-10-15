import type { Migration } from './types';

/**
 * Conventions for every table (see CLAUDE.md, "Data rules"):
 * - `id` is a UUID string.
 * - `created_at`, `updated_at`, `deleted_at` are epoch milliseconds (UTC);
 *   `deleted_at` is NULL unless soft-deleted.
 * - Measurements are canonical: kilograms, meters, seconds.
 */
export const migration001: Migration = {
  version: 1,
  name: 'initial',
  async up(db) {
    await db.exec(`
      CREATE TABLE settings (
        id TEXT PRIMARY KEY NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );

      CREATE TABLE exercises (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        source TEXT NOT NULL CHECK (source IN ('seed', 'custom')),
        seed_key TEXT UNIQUE,
        tracks_weight INTEGER NOT NULL DEFAULT 1 CHECK (tracks_weight IN (0, 1)),
        tracks_reps INTEGER NOT NULL DEFAULT 1 CHECK (tracks_reps IN (0, 1)),
        tracks_time INTEGER NOT NULL DEFAULT 0 CHECK (tracks_time IN (0, 1)),
        tracks_distance INTEGER NOT NULL DEFAULT 0 CHECK (tracks_distance IN (0, 1)),
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );

      CREATE TABLE templates (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );

      CREATE TABLE template_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        template_id TEXT NOT NULL REFERENCES templates (id),
        exercise_id TEXT NOT NULL REFERENCES exercises (id),
        position INTEGER NOT NULL,
        target_sets INTEGER,
        target_reps INTEGER,
        rest_seconds INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE INDEX idx_template_exercises_template ON template_exercises (template_id, position);

      CREATE TABLE workouts (
        id TEXT PRIMARY KEY NOT NULL,
        template_id TEXT REFERENCES templates (id),
        name TEXT,
        started_at INTEGER NOT NULL,
        ended_at INTEGER,
        timezone TEXT NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE INDEX idx_workouts_started_at ON workouts (started_at);

      CREATE TABLE workout_exercises (
        id TEXT PRIMARY KEY NOT NULL,
        workout_id TEXT NOT NULL REFERENCES workouts (id),
        exercise_id TEXT NOT NULL REFERENCES exercises (id),
        position INTEGER NOT NULL,
        notes TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE INDEX idx_workout_exercises_workout ON workout_exercises (workout_id, position);
      CREATE INDEX idx_workout_exercises_exercise ON workout_exercises (exercise_id);

      CREATE TABLE sets (
        id TEXT PRIMARY KEY NOT NULL,
        workout_exercise_id TEXT NOT NULL REFERENCES workout_exercises (id),
        position INTEGER NOT NULL,
        weight_kg REAL CHECK (weight_kg IS NULL OR weight_kg >= 0),
        reps INTEGER CHECK (reps IS NULL OR reps >= 0),
        duration_s REAL CHECK (duration_s IS NULL OR duration_s >= 0),
        distance_m REAL CHECK (distance_m IS NULL OR distance_m >= 0),
        rpe REAL CHECK (rpe IS NULL OR (rpe >= 1 AND rpe <= 10)),
        is_warmup INTEGER NOT NULL DEFAULT 0 CHECK (is_warmup IN (0, 1)),
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE INDEX idx_sets_workout_exercise ON sets (workout_exercise_id, position);
    `);
  },
};
