import type { Migration } from './types';

/** Rest taken after a set, in seconds; set by the rest timer's Log rest button. */
export const migration004: Migration = {
  version: 4,
  name: 'set_rest',
  async up(db) {
    await db.exec(`
      ALTER TABLE sets ADD COLUMN rest_s REAL CHECK (rest_s IS NULL OR rest_s >= 0);
    `);
  },
};
