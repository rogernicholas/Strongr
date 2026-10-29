import type { Db } from '@/core/db/types';

import { v1 } from './v1';
import { v2 } from './v2';
import { v3 } from './v3';
import { v4 } from './v4';

export interface Fixture {
  /** Inserts realistic sample data into a database at exactly this schema version. */
  seed(db: Db): Promise<void>;
  /** Row counts per table that must survive every later migration. */
  expectedCounts: Record<string, number>;
}

/** One fixture per schema version. Adding migration N requires adding fixtures[N]. */
export const fixtures: Record<number, Fixture> = {
  1: v1,
  2: v2,
  3: v3,
  4: v4,
};
