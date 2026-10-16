/** @jest-environment node */
import { migrate, migrations } from '@/core/db';
import { createBodyweightRepository } from '@/data';

import { openNodeDb } from './helpers/nodeDb';

describe('bodyweightRepository', () => {
  it('stores one value per week, replacing on update', async () => {
    const db = openNodeDb();
    await migrate(db, migrations);
    const repo = createBodyweightRepository(db);
    await repo.set('2026-10-12', 76.9);
    await repo.set('2026-10-12', 77.2);
    await repo.set('2026-10-19', 76.5);
    expect(await repo.get('2026-10-12')).toEqual({ weekStart: '2026-10-12', weightKg: 77.2 });
    expect(await repo.list()).toHaveLength(2);
    await expect(repo.set('2026-10-26', 0)).rejects.toThrow();

    await repo.remove('2026-10-12');
    expect(await repo.get('2026-10-12')).toBeNull();
    expect(await repo.list()).toHaveLength(1);
    await repo.set('2026-10-12', 78); // can be entered again after removal
    expect(await repo.get('2026-10-12')).toEqual({ weekStart: '2026-10-12', weightKg: 78 });
  });
});
