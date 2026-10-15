import type { Fixture } from './index';
import { v1 } from './v1';

const T = 1_760_000_000_000;

export const v2: Fixture = {
  async seed(db) {
    await v1.seed(db);
    await db.exec(`
      UPDATE exercises SET muscle_group = 'chest' WHERE id = 'e1';
      INSERT INTO exercises (id, name, source, muscle_group, created_at, updated_at)
        VALUES ('e4', 'Face pull', 'custom', 'shoulders', ${T}, ${T});
    `);
  },
  expectedCounts: { ...v1.expectedCounts, exercises: 4 },
};
