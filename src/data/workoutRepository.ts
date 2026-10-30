import { currentTimezone, systemClock, type Clock } from '@/core/clock';
import type { Db, SqlValue } from '@/core/db';
import { newId } from '@/core/id';
import { MAX_REST_S } from '@/core/training';

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
  /** When the set was logged live; null for sets added to a past workout. */
  completedAt: number | null;
  /**
   * Rest after this set: filled in when the next set of the same exercise is logged
   * within MAX_REST_S, or by the rest timer's Log rest button.
   */
  restS: number | null;
}

/** What the user enters for a set. */
export type SetInput = Omit<LoggedSet, 'id' | 'position' | 'completedAt' | 'restS'>;

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  seedKey: string | null;
  muscleGroup: string | null;
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
  completed_at: number | null;
  rest_s: number | null;
}

const SET_COLUMNS = `s.id, s.workout_exercise_id, s.position, s.weight_kg, s.reps, s.duration_s,
  s.distance_m, s.rpe, s.is_warmup, s.completed_at, s.rest_s`;

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
    completedAt: row.completed_at,
    restS: row.rest_s,
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

  /**
   * Workouts matching `filter` (SQL on alias `w`), oldest first, with their exercises and sets.
   * Three queries in total however many workouts match.
   */
  async function loadWorkouts(filter: string, params: SqlValue[]): Promise<Workout[]> {
    const match = `FROM workouts w WHERE w.deleted_at IS NULL AND ${filter}`;
    const workouts = await db.getAll<{
      id: string;
      template_id: string | null;
      name: string | null;
      started_at: number;
      ended_at: number | null;
      timezone: string;
    }>(
      `SELECT w.id, w.template_id, w.name, w.started_at, w.ended_at, w.timezone ${match}
       ORDER BY w.started_at, w.id`,
      params,
    );
    if (workouts.length === 0) return [];

    const exercises = await db.getAll<{
      id: string;
      workout_id: string;
      exercise_id: string;
      name: string;
      seed_key: string | null;
      muscle_group: string | null;
      position: number;
      tracks_weight: number;
      tracks_reps: number;
      tracks_time: number;
      tracks_distance: number;
    }>(
      `SELECT we.id, we.workout_id, we.exercise_id, e.name, e.seed_key, e.muscle_group, we.position,
         e.tracks_weight, e.tracks_reps, e.tracks_time, e.tracks_distance
       FROM workout_exercises we JOIN exercises e ON e.id = we.exercise_id
       WHERE we.workout_id IN (SELECT w.id ${match}) AND we.deleted_at IS NULL
       ORDER BY we.position`,
      params,
    );
    const sets = await db.getAll<SetRow>(
      `SELECT ${SET_COLUMNS} FROM sets s
       JOIN workout_exercises we ON we.id = s.workout_exercise_id
       WHERE we.workout_id IN (SELECT w.id ${match}) AND s.deleted_at IS NULL
       ORDER BY s.position`,
      params,
    );

    const setsByExercise = new Map<string, LoggedSet[]>();
    for (const row of sets) {
      const list = setsByExercise.get(row.workout_exercise_id) ?? [];
      list.push(toSet(row));
      setsByExercise.set(row.workout_exercise_id, list);
    }
    const exercisesByWorkout = new Map<string, Workout['exercises']>();
    for (const e of exercises) {
      const list = exercisesByWorkout.get(e.workout_id) ?? [];
      list.push({
        id: e.id,
        exerciseId: e.exercise_id,
        exerciseName: e.name,
        seedKey: e.seed_key,
        muscleGroup: e.muscle_group,
        tracks: {
          weight: e.tracks_weight === 1,
          reps: e.tracks_reps === 1,
          time: e.tracks_time === 1,
          distance: e.tracks_distance === 1,
        },
        position: e.position,
        sets: setsByExercise.get(e.id) ?? [],
      });
      exercisesByWorkout.set(e.workout_id, list);
    }
    return workouts.map((w) => ({
      id: w.id,
      templateId: w.template_id,
      name: w.name,
      startedAt: w.started_at,
      endedAt: w.ended_at,
      timezone: w.timezone,
      exercises: exercisesByWorkout.get(w.id) ?? [],
    }));
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
      const [workout] = await loadWorkouts('w.id = ?', [workoutId]);
      return workout ?? null;
    },

    async addExercises(workoutId: string, exerciseIds: readonly string[]): Promise<void> {
      const row = await db.getFirst<{ next: number | null }>(
        'SELECT MAX(position) + 1 AS next FROM workout_exercises WHERE workout_id = ?',
        [workoutId],
      );
      await db.transaction(() => addExercises(workoutId, exerciseIds, row?.next ?? 0));
    },

    /** Takes an exercise out of a workout, with its sets (soft delete). */
    async removeExercise(workoutExerciseId: string): Promise<void> {
      const now = clock();
      await db.transaction(async () => {
        await db.run(
          `UPDATE sets SET deleted_at = ?, updated_at = ?
           WHERE workout_exercise_id = ? AND deleted_at IS NULL`,
          [now, now, workoutExerciseId],
        );
        await db.run('UPDATE workout_exercises SET deleted_at = ?, updated_at = ? WHERE id = ?', [
          now,
          now,
          workoutExerciseId,
        ]);
      });
    },

    /**
     * Logs a set. `timed: false` for sets added to a past workout: they get no
     * completion time, so they can't stretch that workout's length or rest stats.
     */
    async addSet(workoutExerciseId: string, input: SetInput, timed = true): Promise<LoggedSet> {
      if (!hasValue(input)) throw new Error('A set needs at least one value.');
      const id = newId();
      const now = clock();
      const row = await db.getFirst<{ next: number | null }>(
        'SELECT MAX(position) + 1 AS next FROM sets WHERE workout_exercise_id = ?',
        [workoutExerciseId],
      );
      const position = row?.next ?? 0;
      // The workout's last live set. Only when it was this exercise is the gap rest:
      // a different exercise in between means a changeover, which never counts.
      const last = timed
        ? await db.getFirst<{ id: string; we: string; at: number; rest: number | null }>(
            `SELECT s.id, s.workout_exercise_id AS we, s.completed_at AS at, s.rest_s AS rest
             FROM sets s JOIN workout_exercises we ON we.id = s.workout_exercise_id
             WHERE we.workout_id = (SELECT workout_id FROM workout_exercises WHERE id = ?)
               AND we.deleted_at IS NULL AND s.deleted_at IS NULL AND s.completed_at IS NOT NULL
             ORDER BY s.completed_at DESC LIMIT 1`,
            [workoutExerciseId],
          )
        : null;
      const restS =
        last && last.we === workoutExerciseId && last.rest === null
          ? Math.round((now - last.at) / 1000)
          : null;
      await db.transaction(async () => {
        await db.run(
          `INSERT INTO sets (id, workout_exercise_id, position, weight_kg, reps, duration_s,
             distance_m, rpe, is_warmup, completed_at, created_at, updated_at)
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
            timed ? now : null,
            now,
            now,
          ],
        );
        if (last && restS !== null && restS <= MAX_REST_S) {
          await db.run('UPDATE sets SET rest_s = ?, updated_at = ? WHERE id = ?', [
            restS,
            now,
            last.id,
          ]);
        }
      });
      return { id, position, ...input, completedAt: timed ? now : null, restS: null };
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

    /** Saves the rest taken after a set, in seconds. */
    async logRest(setId: string, seconds: number): Promise<void> {
      await db.run('UPDATE sets SET rest_s = ?, updated_at = ? WHERE id = ?', [
        Math.max(0, Math.round(seconds)),
        clock(),
        setId,
      ]);
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

    /**
     * Finished workouts started in [from, to), oldest first, with all sets. Workouts whose
     * sets were all deleted while editing are left out, like an empty workout at Finish.
     */
    async listFinished(from = 0, to = Number.MAX_SAFE_INTEGER): Promise<Workout[]> {
      return loadWorkouts(
        `w.ended_at IS NOT NULL AND w.started_at >= ? AND w.started_at < ?
         AND EXISTS (SELECT 1 FROM sets s
           JOIN workout_exercises we ON we.id = s.workout_exercise_id AND we.deleted_at IS NULL
           WHERE we.workout_id = w.id AND s.deleted_at IS NULL)`,
        [from, to],
      );
    },

    async remove(workoutId: string): Promise<void> {
      const now = clock();
      await db.run('UPDATE workouts SET deleted_at = ?, updated_at = ? WHERE id = ?', [
        now,
        now,
        workoutId,
      ]);
    },

    /** How many workouts have been finished and kept. */
    async countFinished(): Promise<number> {
      const row = await db.getFirst<{ n: number }>(
        'SELECT COUNT(*) AS n FROM workouts WHERE deleted_at IS NULL AND ended_at IS NOT NULL',
      );
      return row?.n ?? 0;
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
         WHERE s.deleted_at IS NULL AND s.is_warmup = 0
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
         ORDER BY w.started_at, w.id, we.position, s.position`,
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

    /**
     * Sets from the most recent earlier workout that logged this exercise. "Earlier" is
     * relative to `workoutId`, so editing an old workout shows the session before it.
     */
    async previousSets(exerciseId: string, workoutId: string): Promise<LoggedSet[]> {
      const last = await db.getFirst<{ id: string }>(
        `SELECT w.id FROM workouts w
         JOIN workout_exercises we ON we.workout_id = w.id AND we.deleted_at IS NULL
         JOIN sets s ON s.workout_exercise_id = we.id AND s.deleted_at IS NULL
         WHERE we.exercise_id = ? AND w.id != ? AND w.deleted_at IS NULL
           AND w.started_at <= COALESCE((SELECT started_at FROM workouts WHERE id = ?), w.started_at)
         ORDER BY w.started_at DESC LIMIT 1`,
        [exerciseId, workoutId, workoutId],
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
