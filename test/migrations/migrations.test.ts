/**
 * @jest-environment node
 *
 * The highest-risk code in the app: a bad migration destroys history.
 * These tests run every migration from an empty database, and upgrade from
 * every earlier schema version with sample data in it.
 */
import { getSchemaVersion, migrate, SchemaTooNewError } from '@/core/db/migrate';
import { LATEST_SCHEMA_VERSION, migrations, type Migration } from '@/core/db/migrations';

import { openNodeDb } from '../helpers/nodeDb';
import { fixtures } from './fixtures';

const DATA_TABLES = [
  'settings',
  'exercises',
  'templates',
  'template_exercises',
  'workouts',
  'workout_exercises',
  'sets',
];

async function count(db: ReturnType<typeof openNodeDb>, table: string) {
  const row = await db.getFirst<{ n: number }>(`SELECT COUNT(*) AS n FROM ${table}`);
  return row?.n ?? 0;
}

describe('migrations', () => {
  it('has a fixture for every schema version', () => {
    for (let v = 1; v <= LATEST_SCHEMA_VERSION; v++) {
      expect(fixtures[v]).toBeDefined();
    }
  });

  it('migrates an empty database to the latest version', async () => {
    const db = openNodeDb();
    expect(await getSchemaVersion(db)).toBe(0);
    expect(await migrate(db, migrations)).toBe(LATEST_SCHEMA_VERSION);
    db.close();
  });

  it('gives every data table id, created_at, updated_at and deleted_at', async () => {
    const db = openNodeDb();
    await migrate(db, migrations);
    for (const table of DATA_TABLES) {
      const columns = await db.getAll<{ name: string; pk: number }>(`PRAGMA table_info(${table})`);
      const names = columns.map((c) => c.name);
      expect(names).toEqual(
        expect.arrayContaining(['id', 'created_at', 'updated_at', 'deleted_at']),
      );
      expect(columns.find((c) => c.pk === 1)?.name).toBe('id');
    }
    db.close();
  });

  it('is a no-op when run again', async () => {
    const db = openNodeDb();
    await migrate(db, migrations);
    expect(await migrate(db, migrations)).toBe(LATEST_SCHEMA_VERSION);
    const rows = await db.getAll('SELECT * FROM schema_version');
    expect(rows).toHaveLength(LATEST_SCHEMA_VERSION);
    db.close();
  });

  // For every version v: build the db at v, fill it with v's sample data,
  // upgrade to latest, and check nothing was lost.
  for (let from = 1; from <= LATEST_SCHEMA_VERSION; from++) {
    it(`upgrades from v${from} with data intact`, async () => {
      const db = openNodeDb();
      await migrate(db, migrations, { target: from });
      const fixture = fixtures[from]!;
      await fixture.seed(db);

      expect(await migrate(db, migrations)).toBe(LATEST_SCHEMA_VERSION);

      for (const [table, expected] of Object.entries(fixture.expectedCounts)) {
        expect({ table, rows: await count(db, table) }).toEqual({ table, rows: expected });
      }
      const fk = await db.getAll('PRAGMA foreign_key_check');
      expect(fk).toEqual([]);
      db.close();
    });
  }

  it('refuses to open a database from a newer app version', async () => {
    const db = openNodeDb();
    await migrate(db, migrations);
    await db.run('INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, ?)', [
      LATEST_SCHEMA_VERSION + 1,
      'from_the_future',
      0,
    ]);
    await expect(migrate(db, migrations)).rejects.toBeInstanceOf(SchemaTooNewError);
    db.close();
  });

  it('rolls back a failing migration and keeps the previous version', async () => {
    const broken: Migration = {
      version: LATEST_SCHEMA_VERSION + 1,
      name: 'broken',
      async up(db) {
        await db.exec('CREATE TABLE half_done (id TEXT PRIMARY KEY);');
        await db.exec('THIS IS NOT SQL;');
      },
    };
    const db = openNodeDb();
    await migrate(db, migrations);
    await expect(migrate(db, [...migrations, broken])).rejects.toThrow();
    expect(await getSchemaVersion(db)).toBe(LATEST_SCHEMA_VERSION);
    const leftover = await db.getFirst(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'half_done'",
    );
    expect(leftover).toBeNull();
    db.close();
  });

  it('rejects migrations that are out of order', async () => {
    const db = openNodeDb();
    const gap: Migration = { version: 3, name: 'gap', up: async () => {} };
    await expect(migrate(db, [...migrations, gap].slice(0, 1).concat(gap))).rejects.toThrow(
      /expected 2/,
    );
    db.close();
  });

  it('enforces canonical, non-negative measurements and RPE 1-10', async () => {
    const db = openNodeDb();
    await migrate(db, migrations);
    await fixtures[1]!.seed(db);
    const insert = (col: string, value: number) =>
      db.run(
        `INSERT INTO sets (id, workout_exercise_id, position, ${col}, created_at, updated_at) VALUES (?, 'we1', 9, ?, 0, 0)`,
        [`bad-${col}-${value}`, value],
      );
    await expect(insert('weight_kg', -1)).rejects.toThrow();
    await expect(insert('rpe', 11)).rejects.toThrow();
    await expect(insert('rpe', 0)).rejects.toThrow();
    await expect(insert('rpe', 7.5)).resolves.toBeDefined();
    db.close();
  });
});
