/** @jest-environment node */
import { defaultSettings } from '@/config/defaults';
import { migrate, migrations } from '@/core/db';
import { createSettingsRepository } from '@/data';

import { openNodeDb } from './helpers/nodeDb';

async function setup() {
  const db = openNodeDb();
  await migrate(db, migrations);
  return { db, repo: createSettingsRepository(db, () => 1000) };
}

describe('settingsRepository', () => {
  it('returns defaults on a fresh install', async () => {
    const { repo } = await setup();
    expect(await repo.load()).toEqual(defaultSettings);
  });

  it('saves and reloads, keeping a single row', async () => {
    const { db, repo } = await setup();
    await repo.save({ ...defaultSettings, weightUnit: 'lb' });
    await repo.save({ ...defaultSettings, weightUnit: 'lb', theme: 'dark' });
    expect(await repo.load()).toMatchObject({ weightUnit: 'lb', theme: 'dark' });
    expect(await db.getAll('SELECT * FROM settings')).toHaveLength(1);
  });

  it('falls back to defaults when the stored JSON is corrupt', async () => {
    const { db, repo } = await setup();
    await db.run(
      "INSERT INTO settings (id, data, created_at, updated_at) VALUES ('x', '{not json', 0, 0)",
    );
    expect(await repo.load()).toEqual(defaultSettings);
  });
});
