import { DatabaseSync } from 'node:sqlite';

import type { Db } from '@/core/db/types';

/**
 * A Db backed by Node's built-in SQLite, so migrations and repositories are
 * tested against a real SQLite engine. Mirrors the pragmas used in expoDb.ts.
 */
export function openNodeDb(): Db & { close(): void } {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON;');

  return {
    async exec(sql) {
      sqlite.exec(sql);
    },
    async run(sql, params = []) {
      const result = sqlite.prepare(sql).run(...params);
      return { changes: Number(result.changes) };
    },
    async getAll<T>(sql: string, params: (string | number | null)[] = []) {
      return sqlite.prepare(sql).all(...params) as T[];
    },
    async getFirst<T>(sql: string, params: (string | number | null)[] = []) {
      return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
    },
    async transaction(task) {
      sqlite.exec('BEGIN');
      try {
        await task();
        sqlite.exec('COMMIT');
      } catch (error) {
        sqlite.exec('ROLLBACK');
        throw error;
      }
    },
    close: () => sqlite.close(),
  };
}
