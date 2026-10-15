import type { Settings } from '@/config/defaults';
import { seedExercises } from '@/config/seedExercises';
import { migrate, migrations, type Db } from '@/core/db';
import {
  createExerciseRepository,
  createSettingsRepository,
  type SettingsRepository,
} from '@/data';

export interface AppContext {
  db: Db;
  settings: Settings;
  settingsRepository: SettingsRepository;
}

/** Opens the database, brings it to the latest schema, adds new seed exercises, and loads settings. */
export async function bootstrap(open: () => Promise<Db>): Promise<AppContext> {
  const db = await open();
  await migrate(db, migrations);
  await createExerciseRepository(db).syncSeeds(seedExercises);
  const settingsRepository = createSettingsRepository(db);
  const settings = await settingsRepository.load();
  return { db, settings, settingsRepository };
}
