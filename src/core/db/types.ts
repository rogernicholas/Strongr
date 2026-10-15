/**
 * The minimal database surface the app relies on.
 *
 * The app uses an expo-sqlite adapter; tests use a node:sqlite adapter, so
 * migrations and repositories run against real SQLite in Jest.
 */
export type SqlValue = string | number | null;

export interface Db {
  exec(sql: string): Promise<void>;
  run(sql: string, params?: SqlValue[]): Promise<{ changes: number }>;
  getAll<T>(sql: string, params?: SqlValue[]): Promise<T[]>;
  getFirst<T>(sql: string, params?: SqlValue[]): Promise<T | null>;
  /** Runs `task` in a transaction; rolls back if it throws. */
  transaction(task: () => Promise<void>): Promise<void>;
}
