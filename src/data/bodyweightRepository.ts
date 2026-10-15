import { systemClock, type Clock } from '@/core/clock';
import type { Db } from '@/core/db';
import { newId } from '@/core/id';

export interface Bodyweight {
  /** Monday of the week, YYYY-MM-DD. */
  weekStart: string;
  weightKg: number;
}

export function createBodyweightRepository(db: Db, clock: Clock = systemClock) {
  return {
    async get(weekStart: string): Promise<Bodyweight | null> {
      const row = await db.getFirst<{ week_start: string; weight_kg: number }>(
        'SELECT week_start, weight_kg FROM bodyweights WHERE week_start = ? AND deleted_at IS NULL',
        [weekStart],
      );
      return row ? { weekStart: row.week_start, weightKg: row.weight_kg } : null;
    },

    async list(): Promise<Bodyweight[]> {
      const rows = await db.getAll<{ week_start: string; weight_kg: number }>(
        'SELECT week_start, weight_kg FROM bodyweights WHERE deleted_at IS NULL ORDER BY week_start',
      );
      return rows.map((r) => ({ weekStart: r.week_start, weightKg: r.weight_kg }));
    },

    /** Sets (or replaces) the bodyweight for a week. */
    async set(weekStart: string, weightKg: number): Promise<void> {
      if (!(weightKg > 0)) throw new Error('Bodyweight must be positive.');
      const now = clock();
      const updated = await db.run(
        'UPDATE bodyweights SET weight_kg = ?, updated_at = ? WHERE week_start = ? AND deleted_at IS NULL',
        [weightKg, now, weekStart],
      );
      if (updated.changes === 0) {
        await db.run(
          `INSERT INTO bodyweights (id, week_start, weight_kg, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?)`,
          [newId(), weekStart, weightKg, now, now],
        );
      }
    },
  };
}

export type BodyweightRepository = ReturnType<typeof createBodyweightRepository>;
