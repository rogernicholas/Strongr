import type { Migration } from './types';

export const migration002: Migration = {
  version: 2,
  name: 'exercise_muscle_group',
  async up(db) {
    await db.exec(`
      ALTER TABLE exercises ADD COLUMN muscle_group TEXT;
      CREATE INDEX idx_exercises_muscle_group ON exercises (muscle_group, name);
    `);
  },
};
