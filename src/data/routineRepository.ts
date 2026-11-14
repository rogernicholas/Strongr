import { systemClock, type Clock } from '@/core/clock';
import type { Db } from '@/core/db';
import { newId } from '@/core/id';

/** A saved list of exercises, e.g. "A". Stored in the `templates` table. */
export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
}

/**
 * A routine's exercises re-sorted to follow a workout's order. Exercises the workout
 * also has take the routine's slots in the workout's order; the rest stay where they are.
 * `[A, B, C, D]` with a workout of `[C, X, A]` gives `[C, B, A, D]`.
 */
export function followOrder(routine: readonly string[], workout: readonly string[]): string[] {
  const shared = new Set(routine.filter((id) => workout.includes(id)));
  const queue = workout.filter((id, i) => shared.has(id) && workout.indexOf(id) === i);
  // Each shared exercise's first slot is refilled; a routine listing one twice keeps the copy.
  const slots = routine.flatMap((id, i) =>
    shared.has(id) && routine.indexOf(id) === i ? [i] : [],
  );
  const result = [...routine];
  slots.forEach((slot, k) => (result[slot] = queue[k]!));
  return result;
}

export function createRoutineRepository(db: Db, clock: Clock = systemClock) {
  async function replaceExercises(routineId: string, exerciseIds: readonly string[], now: number) {
    await db.run(
      'UPDATE template_exercises SET deleted_at = ?, updated_at = ? WHERE template_id = ? AND deleted_at IS NULL',
      [now, now, routineId],
    );
    for (const [position, exerciseId] of exerciseIds.entries()) {
      await db.run(
        `INSERT INTO template_exercises (id, template_id, exercise_id, position, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [newId(), routineId, exerciseId, position, now, now],
      );
    }
  }

  function cleanName(name: string): string {
    const clean = name.trim();
    if (!clean) throw new Error('Routine name is required.');
    return clean;
  }

  return {
    async list(): Promise<Routine[]> {
      const routines = await db.getAll<{ id: string; name: string }>(
        'SELECT id, name FROM templates WHERE deleted_at IS NULL ORDER BY name COLLATE NOCASE',
      );
      const links = await db.getAll<{ template_id: string; exercise_id: string }>(
        `SELECT te.template_id, te.exercise_id
         FROM template_exercises te
         JOIN exercises e ON e.id = te.exercise_id AND e.deleted_at IS NULL
         WHERE te.deleted_at IS NULL
         ORDER BY te.template_id, te.position`,
      );
      return routines.map((r) => ({
        ...r,
        exerciseIds: links.filter((l) => l.template_id === r.id).map((l) => l.exercise_id),
      }));
    },

    async create(name: string, exerciseIds: readonly string[]): Promise<Routine> {
      const id = newId();
      const now = clock();
      const clean = cleanName(name);
      await db.transaction(async () => {
        await db.run(
          'INSERT INTO templates (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [id, clean, now, now],
        );
        await replaceExercises(id, exerciseIds, now);
      });
      return { id, name: clean, exerciseIds: [...exerciseIds] };
    },

    async update(id: string, changes: { name?: string; exerciseIds?: readonly string[] }) {
      const now = clock();
      await db.transaction(async () => {
        if (changes.name !== undefined) {
          await db.run('UPDATE templates SET name = ?, updated_at = ? WHERE id = ?', [
            cleanName(changes.name),
            now,
            id,
          ]);
        }
        if (changes.exerciseIds) await replaceExercises(id, changes.exerciseIds, now);
      });
    },

    /**
     * Remembers the order a workout used (its exercise ids), so the routine starts that way
     * next time.
     * Only positions change; exercises are never added or removed here.
     */
    async followWorkoutOrder(id: string, workoutOrder: readonly string[]): Promise<void> {
      const rows = await db.getAll<{ id: string; exercise_id: string }>(
        `SELECT id, exercise_id FROM template_exercises
         WHERE template_id = ? AND deleted_at IS NULL ORDER BY position`,
        [id],
      );
      const wanted = followOrder(
        rows.map((r) => r.exercise_id),
        workoutOrder,
      );
      const now = clock();
      const remaining = [...rows];
      await db.transaction(async () => {
        for (const [position, exerciseId] of wanted.entries()) {
          const at = remaining.findIndex((r) => r.exercise_id === exerciseId);
          const [row] = remaining.splice(at, 1);
          await db.run(
            'UPDATE template_exercises SET position = ?, updated_at = ? WHERE id = ? AND position <> ?',
            [position, now, row!.id, position],
          );
        }
      });
    },

    async remove(id: string): Promise<void> {
      const now = clock();
      await db.run('UPDATE templates SET deleted_at = ?, updated_at = ? WHERE id = ?', [
        now,
        now,
        id,
      ]);
    },
  };
}

export type RoutineRepository = ReturnType<typeof createRoutineRepository>;
