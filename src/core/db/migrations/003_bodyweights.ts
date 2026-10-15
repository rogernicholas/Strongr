import type { Migration } from './types';

/** Weekly bodyweight. One active row per week; week_start is the local Monday, YYYY-MM-DD. */
export const migration003: Migration = {
  version: 3,
  name: 'bodyweights',
  async up(db) {
    await db.exec(`
      CREATE TABLE bodyweights (
        id TEXT PRIMARY KEY NOT NULL,
        week_start TEXT NOT NULL,
        weight_kg REAL NOT NULL CHECK (weight_kg > 0),
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted_at INTEGER
      );
      CREATE UNIQUE INDEX idx_bodyweights_week ON bodyweights (week_start) WHERE deleted_at IS NULL;
    `);
  },
};
