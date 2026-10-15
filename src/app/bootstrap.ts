import type { Settings } from '@/config/defaults';
import { migrate, migrations, type Db } from '@/core/db';
import { createSettingsRepository, type SettingsRepository } from '@/data';

export interface AppContext {
  db: Db;
  settings: Settings;
  settingsRepository: SettingsRepository;
}

/** Opens the database, brings it to the latest schema, and loads settings. */
export async function bootstrap(open: () => Promise<Db>): Promise<AppContext> {
  const db = await open();
  await migrate(db, migrations);
  const settingsRepository = createSettingsRepository(db);
  const settings = await settingsRepository.load();
  return { db, settings, settingsRepository };
}
