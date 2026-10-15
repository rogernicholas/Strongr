import type { Fixture } from './index';
import { v2 } from './v2';

const T = 1_760_000_000_000;

export const v3: Fixture = {
  async seed(db) {
    await v2.seed(db);
    await db.exec(`
      INSERT INTO bodyweights (id, week_start, weight_kg, created_at, updated_at)
        VALUES ('b1', '2026-10-12', 76.9, ${T}, ${T});
    `);
  },
  expectedCounts: { ...v2.expectedCounts, bodyweights: 1 },
};
