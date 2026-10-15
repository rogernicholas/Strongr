import * as SQLite from 'expo-sqlite';

import type { Db } from './types';

export const DATABASE_NAME = 'strongr.db';

export async function openExpoDb(name: string = DATABASE_NAME): Promise<Db> {
  const sqlite = await SQLite.openDatabaseAsync(name);
  await sqlite.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  return {
    exec: (sql) => sqlite.execAsync(sql),
    run: async (sql, params = []) => {
      const result = await sqlite.runAsync(sql, params);
      return { changes: result.changes };
    },
    getAll: (sql, params = []) => sqlite.getAllAsync(sql, params),
    getFirst: (sql, params = []) => sqlite.getFirstAsync(sql, params),
    transaction: (task) => sqlite.withTransactionAsync(task),
  };
}
