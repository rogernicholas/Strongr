import { defaultSettings, type Settings } from '@/config/defaults';
import { systemClock, type Clock } from '@/core/clock';
import type { Db } from '@/core/db';
import { newId } from '@/core/id';
import { parseSettings } from '@/core/settings/parseSettings';

interface SettingsRow {
  id: string;
  data: string;
}

/** Settings are a single row holding one JSON object. */
export function createSettingsRepository(db: Db, clock: Clock = systemClock) {
  async function findRow(): Promise<SettingsRow | null> {
    return db.getFirst<SettingsRow>(
      'SELECT id, data FROM settings WHERE deleted_at IS NULL ORDER BY created_at LIMIT 1',
    );
  }

  return {
    async load(): Promise<Settings> {
      const row = await findRow();
      if (!row) return { ...defaultSettings };
      try {
        return parseSettings(JSON.parse(row.data));
      } catch {
        return { ...defaultSettings };
      }
    },

    async save(settings: Settings): Promise<void> {
      const data = JSON.stringify(parseSettings(settings));
      const now = clock();
      const row = await findRow();
      if (row) {
        await db.run('UPDATE settings SET data = ?, updated_at = ? WHERE id = ?', [
          data,
          now,
          row.id,
        ]);
      } else {
        await db.run(
          'INSERT INTO settings (id, data, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [newId(), data, now, now],
        );
      }
    },
  };
}

export type SettingsRepository = ReturnType<typeof createSettingsRepository>;
