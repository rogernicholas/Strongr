import { systemClock, type Clock } from '@/core/clock';
import type { Db } from '@/core/db';
import { newId } from '@/core/id';

/** A saved list of exercises, e.g. "A". Stored in the `templates` table. */
export interface Routine {
  id: string;
  name: string;
  exerciseIds: string[];
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
