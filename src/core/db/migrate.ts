import type { Migration } from './migrations/types';
import type { Db } from './types';

export class SchemaTooNewError extends Error {
  constructor(
    readonly databaseVersion: number,
    readonly appVersion: number,
  ) {
    super(
      `Database schema version ${databaseVersion} is newer than this app supports (${appVersion}).`,
    );
    this.name = 'SchemaTooNewError';
  }
}

export function assertMigrationsAreSequential(list: readonly Migration[]): void {
  list.forEach((migration, index) => {
    if (migration.version !== index + 1) {
      throw new Error(
        `Migration "${migration.name}" has version ${migration.version}, expected ${index + 1}.`,
      );
    }
  });
}

export async function getSchemaVersion(db: Db): Promise<number> {
  const table = await db.getFirst<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'schema_version'",
  );
  if (!table) return 0;
  const row = await db.getFirst<{ version: number | null }>(
    'SELECT MAX(version) AS version FROM schema_version',
  );
  return row?.version ?? 0;
}

/**
 * Brings the database up to `target` (default: the newest migration).
 * Each migration runs in its own transaction together with its
 * schema_version row, so a failure leaves the database at the last good version.
 */
export async function migrate(
  db: Db,
  list: readonly Migration[],
  options: { target?: number; now?: () => number } = {},
): Promise<number> {
  assertMigrationsAreSequential(list);
  const target = options.target ?? list.length;
  const now = options.now ?? Date.now;

  await db.exec(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      applied_at INTEGER NOT NULL
    );
  `);

  const current = await getSchemaVersion(db);
  if (current > list.length) throw new SchemaTooNewError(current, list.length);

  for (const migration of list.slice(current, target)) {
    await db.transaction(async () => {
      await migration.up(db);
      await db.run('INSERT INTO schema_version (version, name, applied_at) VALUES (?, ?, ?)', [
        migration.version,
        migration.name,
        now(),
      ]);
    });
  }

  return getSchemaVersion(db);
}
