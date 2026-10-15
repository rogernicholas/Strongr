import { getSchemaVersion, type Db } from '@/core/db';

export function createMetaRepository(db: Db) {
  return {
    schemaVersion: () => getSchemaVersion(db),
  };
}
