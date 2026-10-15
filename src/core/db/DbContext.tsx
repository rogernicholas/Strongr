import { createContext, useContext, type ReactNode } from 'react';

import type { Db } from './types';

const DbContext = createContext<Db | null>(null);

export function DbProvider({ db, children }: { db: Db; children: ReactNode }) {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

/** The open, migrated database. Pass it to repositories in src/data, never query it in UI. */
export function useDb(): Db {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be used inside DbProvider');
  return db;
}
