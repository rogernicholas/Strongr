import type { Fixture } from './index';
import { v3 } from './v3';

export const v4: Fixture = {
  async seed(db) {
    await v3.seed(db);
    await db.exec(`UPDATE sets SET rest_s = 95 WHERE id = (SELECT MIN(id) FROM sets);`);
  },
  expectedCounts: v3.expectedCounts,
};
