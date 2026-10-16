import { currentTimezone, systemClock, type Clock } from '@/core/clock';
import type { Db } from '@/core/db';
import { newId } from '@/core/id';

/** One logged set. Canonical units: kg, seconds, meters. */
export interface LoggedSet {
  id: string;
  position: number;
  weightKg: number | null;
  reps: number | null;
  durationS: number | null;
  distanceM: number | null;
  rpe: number | null;
  isWarmup: boolean;
}

export type SetInput = Omit<LoggedSet, 'id' | 'position'>;

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  tracks: { weight: boolean; reps: boolean; time: boolean; distance: boolean };
  position: number;
  sets: LoggedSet[];
}

export interface Workout {
  id: string;
  templateId: string | null;
  name: string | null;
  startedAt: number;
  endedAt: number | null;
  timezone: string;
  exercises: WorkoutExercise[];
}

interface SetRow {
  id: string;
  workout_exercise_id: string;
  position: number;
  weight_kg: number | null;
  reps: number | null;
  duration_s: number | null;
  distance_m: number | null;
  rpe: number | null;
  is_warmup: number;
}

const SET_COLUMNS =
  's.id, s.workout_exercise_id, s.position, s.weight_kg, s.reps, s.duration_s, s.distance_m, s.rpe, s.is_warmup';

/** One finished workout's sets for a single exercise. */
export interface ExerciseSession {
  workoutId: string;
  startedAt: number;
  sets: LoggedSet[];
}

export interface LoggedExercise {
  exerciseId: string;
  name: string;
  sessions: number;
  lastAt: number;
}

function toSet(row: SetRow): LoggedSet {
  return {
    id: row.id,
    position: row.position,
    weightKg: row.weight_kg,
    reps: row.reps,
    durationS: row.duration_s,
    distanceM: row.distance_m,
    rpe: row.rpe,
    isWarmup: row.is_warmup === 1,
  };
}

function hasValue(input: SetInput): boolean {
  return [input.weightKg, input.reps, input.durationS, input.distanceM].some((v) => v !== null);
}

export function createWorkoutRepository(db: Db, clock: Clock = systemClock) {
  async function addExercises(workoutId: string, exerciseIds: readonly string[], from: number) {
    const now = clock();
    for (const [i, exerciseId] of exerciseIds.entries()) {
      await db.run(
        `INSERT INTO workout_exercises (id, workout_id, exercise_id, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId(), workoutId, exerciseId, from + i, now, now],
      );
    }
  }

  const repo = {
    async start(input: {
      exerciseIds: readonly string[];
      templateId?: string | null;
      name?: string | null;
    }): Promise<string> {
      // Only one workout runs at a time: close any that were left open.
      const open = await db.getAll<{ id: string }>(
        'SELECT id FROM workouts WHERE ended_at IS NULL AND deleted_at IS NULL',
      );
      for (const w of open) await repo.finish(w.id);

      const id = newId();
      const now = clock();
      await db.transaction(async () => {
        await db.run(
          `INSERT INTO workouts (id, template_id, name, started_at, timezone, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [id, input.templateId ?? null, input.name ?? null, now, currentTimezone(), now, now],
        );
        await addExercises(id, input.exerciseIds, 0);
      });
      return id;
    },

    /** The most recent workout that was started but not finished, if any. */
    async findActive(): Promise<string | null> {
      const row = await db.getFirst<{ id: string }>(
        `SELECT id FROM workouts WHERE ended_at IS NULL AND deleted_at IS NULL
         ORDER BY started_at DESC LIMIT 1`,
      );
      return row?.id ?? null;
    },

    async get(workoutId: string): Promise<Workout | null> {
      const w = await db.getFirst<{
        id: string;
        template_id: string | null;
        name: string | null;
        started_at: number;
        ended_at: number | null;
        timezone: string;
      }>(
        `SELECT id, template_id, name, started_at, ended_at, timezone
         FROM workouts WHERE id = ? AND deleted_at IS NULL`,
        [workoutId],
      );
      if (!w) return null;

      const exercises = await db.getAll<{
        id: string;
        exercise_id: string;
        name: string;
        position: number;
        tracks_weight: number;
        tracks_reps: number;
        tracks_time: number;
        tracks_distance: number;
      }>(
        `SELECT we.id, we.exercise_id, e.name, we.position,
           e.tracks_weight, e.tracks_reps, e.tracks_time, e.tracks_distance
         FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
         WHERE we.workout_id = ? AND we.deleted_at IS NULL
         ORDER BY we.position`,
        [workoutId],
      );
      const sets = await db.getAll<SetRow>(
        `SELECT ${SET_COLUMNS} FROM sets s
         JOIN workout_exercises we ON we.id = s.workout_exercise_id
         WHERE we.workout_id = ? AND s.deleted_at IS NULL
         ORDER BY s.position`,
        [workoutId],
      );

      return {
        id: w.id,
        templateId: w.template_id,
        name: w.name,
        startedAt: w.started_at,
        endedAt: w.ended_at,
        timezone: w.timezone,
        exercises: exercises.map((e) => ({
          id: e.id,
          exerciseId: e.exercise_id,
          exerciseName: e.name,
          tracks: {
            weight: e.tracks_weight === 1,
            reps: e.tracks_reps === 1,
            time: e.tracks_time === 1,
            distance: e.tracks_distance === 1,
          },
          position: e.position,
          sets: sets.filter((s) => s.workout_exercise_id === e.id).map(toSet),
        })),
      };
    },

    async addExercises(workoutId: string, exerciseIds: readonly string[]): Promise<void> {
      const row = await db.getFirst<{ next: number | null }>(
        'SELECT MAX(position) + 1 AS next FROM workout_exercises WHERE workout_id = ?',
        [workoutId],
      );
      await db.transaction(() => addExercises(workoutId, exerciseIds, row?.next ?? 0));
    },

    async addSet(workoutExerciseId: string, input: SetInput): Promise<LoggedSet> {
      if (!hasValue(input)) throw new Error('A set needs at least one value.');
      const id = newId();
      const now = clock();
      const row = await db.getFirst<{ next: number | null }>(
        'SELECT MAX(position) + 1 AS next FROM sets WHERE workout_exercise_id = ?',
        [workoutExerciseId],
      );
      const position = row?.next ?? 0;
      await db.run(
        `INSERT INTO sets (id, workout_exercise_id, position, weight_kg, reps, duration_s, distance_m,
           rpe, is_warmup, completed_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          workoutExerciseId,
          position,
          input.weightKg,
          input.reps,
          input.durationS,
          input.distanceM,
          input.rpe,
          input.isWarmup ? 1 : 0,
          now,
          now,
          now,
        ],
      );
      return { id, position, ...input };
    },

    async updateSet(setId: string, input: SetInput): Promise<void> {
      if (!hasValue(input)) throw new Error('A set needs at least one value.');
      await db.run(
        `UPDATE sets SET weight_kg = ?, reps = ?, duration_s = ?, distance_m = ?, rpe = ?,
           is_warmup = ?, updated_at = ? WHERE id = ?`,
        [
          input.weightKg,
          input.reps,
          input.durationS,
          input.distanceM,
          input.rpe,
          input.isWarmup ? 1 : 0,
          clock(),
          setId,
        ],
      );
    },

    async deleteSet(setId: string): Promise<void> {
      const now = clock();
      await db.run('UPDATE sets SET deleted_at = ?, updated_at = ? WHERE id = ?', [
        now,
        now,
        setId,
      ]);
    },

    /**
     * Ends the workout. A workout with no sets is discarded (soft-deleted)
     * so abandoned sessions don't clutter the calendar.
     */
    async finish(workoutId: string): Promise<'saved' | 'discarded'> {
      const now = clock();
      const count = await db.getFirst<{ n: number }>(
        `SELECT COUNT(*) AS n FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
         WHERE we.workout_id = ? AND s.deleted_at IS NULL`,
        [workoutId],
      );
      if (!count?.n) {
        await db.run(
          'UPDATE workouts SET ended_at = ?, deleted_at = ?, updated_at = ? WHERE id = ?',
          [now, now, now, workoutId],
        );
        return 'discarded';
      }
      await db.run('UPDATE workouts SET ended_at = ?, updated_at = ? WHERE id = ?', [
        now,
        now,
        workoutId,
      ]);
      return 'saved';
    },

    /** Finished workouts started in [from, to), oldest first, with all sets. */
    async listFinished(from = 0, to = Number.MAX_SAFE_INTEGER): Promise<Workout[]> {
      const rows = await db.getAll<{ id: string }>(
        `SELECT id FROM workouts
         WHERE deleted_at IS NULL AND ended_at IS NOT NULL AND started_at >= ? AND started_at < ?
         ORDER BY started_at`,
        [from, to],
      );
      const workouts = await Promise.all(rows.map((r) => repo.get(r.id)));
      return workouts.filter((w): w is Workout => w !== null);
    },

    async remove(workoutId: string): Promise<void> {
      const now = clock();
      await db.run('UPDATE workouts SET deleted_at = ?, updated_at = ? WHERE id = ?', [
        now,
        now,
        workoutId,
      ]);
    },

    /** Exercises with at least one set in a finished workout, most recently trained first. */
    async loggedExercises(): Promise<LoggedExercise[]> {
      const rows = await db.getAll<{
        exercise_id: string;
        name: string;
        sessions: number;
        last_at: number;
      }>(
        `SELECT e.id AS exercise_id, e.name, COUNT(DISTINCT w.id) AS sessions,
           MAX(w.started_at) AS last_at
         FROM sets s
         JOIN workout_exercises we ON we.id = s.workout_exercise_id AND we.deleted_at IS NULL
         JOIN workouts w ON w.id = we.workout_id
           AND w.deleted_at IS NULL AND w.ended_at IS NOT NULL
         JOIN exercises e ON e.id = we.exercise_id
         WHERE s.deleted_at IS NULL
         GROUP BY e.id
         ORDER BY last_at DESC`,
      );
      return rows.map((r) => ({
        exerciseId: r.exercise_id,
        name: r.name,
        sessions: r.sessions,
        lastAt: r.last_at,
      }));
    },

    /** Every finished workout's sets for one exercise, oldest first. */
    async exerciseSessions(exerciseId: string): Promise<ExerciseSession[]> {
      const rows = await db.getAll<SetRow & { workout_id: string; started_at: number }>(
        `SELECT ${SET_COLUMNS}, w.id AS workout_id, w.started_at
         FROM sets s
         JOIN workout_exercises we ON we.id = s.workout_exercise_id AND we.deleted_at IS NULL
         JOIN workouts w ON w.id = we.workout_id
           AND w.deleted_at IS NULL AND w.ended_at IS NOT NULL
         WHERE we.exercise_id = ? AND s.deleted_at IS NULL
         ORDER BY w.started_at, we.position, s.position`,
        [exerciseId],
      );
      const sessions: ExerciseSession[] = [];
      for (const row of rows) {
        let session = sessions[sessions.length - 1];
        if (session?.workoutId !== row.workout_id) {
          session = { workoutId: row.workout_id, startedAt: row.started_at, sets: [] };
          sessions.push(session);
        }
        session.sets.push(toSet(row));
      }
      return sessions;
    },

    /** Sets from the most recent other workout that logged this exercise. */
    async previousSets(exerciseId: string, excludeWorkoutId: string): Promise<LoggedSet[]> {
      const last = await db.getFirst<{ id: string }>(
        `SELECT w.id FROM workouts w
         JOIN workout_exercises we ON we.workout_id = w.id AND we.deleted_at IS NULL
         JOIN sets s ON s.workout_exercise_id = we.id AND s.deleted_at IS NULL
         WHERE we.exercise_id = ? AND w.id != ? AND w.deleted_at IS NULL
         ORDER BY w.started_at DESC LIMIT 1`,
        [exerciseId, excludeWorkoutId],
      );
      if (!last) return [];
      const rows = await db.getAll<SetRow>(
        `SELECT ${SET_COLUMNS} FROM sets s
         JOIN workout_exercises we ON we.id = s.workout_exercise_id AND we.deleted_at IS NULL
         WHERE we.workout_id = ? AND we.exercise_id = ? AND s.deleted_at IS NULL
         ORDER BY we.position, s.position`,
        [last.id, exerciseId],
      );
      return rows.map(toSet);
    },
  };
  return repo;
}

export type WorkoutRepository = ReturnType<typeof createWorkoutRepository>;
