import { migration001 } from './001_initial';
import { migration002 } from './002_exercise_muscle_group';
import { migration003 } from './003_bodyweights';
import type { Migration } from './types';

/**
 * Every migration, in order. Forward-only: never edit a migration that has
 * shipped in an APK; add a new one instead. Each new migration needs a
 * fixture in test/migrations/fixtures (see the migration tests).
 */
export const migrations: readonly Migration[] = [migration001, migration002, migration003];

export const LATEST_SCHEMA_VERSION = migrations.length;

export type { Migration } from './types';
