/** @jest-environment node */
import { seedExercises } from '@/config/seedExercises';
import { migrate, migrations } from '@/core/db';
import { createExerciseRepository, DuplicateExerciseError } from '@/data';

import { openNodeDb } from './helpers/nodeDb';

async function setup() {
  const db = openNodeDb();
  await migrate(db, migrations);
  return { db, repo: createExerciseRepository(db, () => 1000) };
}

describe('exerciseRepository', () => {
  it('seed keys are unique', () => {
    const keys = seedExercises.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('seeds once and is idempotent', async () => {
    const { repo } = await setup();
    expect(await repo.syncSeeds(seedExercises)).toBe(seedExercises.length);
    expect(await repo.syncSeeds(seedExercises)).toBe(0);
    expect(await repo.list()).toHaveLength(seedExercises.length);
  });

  it('never overwrites user edits or resurrects deleted seeds', async () => {
    const { db, repo } = await setup();
    await repo.syncSeeds(seedExercises);
    await db.run("UPDATE exercises SET name = 'My bench' WHERE seed_key = 'bench_press'");
    await db.run("UPDATE exercises SET deleted_at = 1 WHERE seed_key = 'plank'");
    await repo.syncSeeds(seedExercises);
    const names = (await repo.list()).map((e) => e.name);
    expect(names).toContain('My bench');
    expect(names).not.toContain('Bench press');
    expect(names).not.toContain('Plank');
  });

  it('adds new seeds from a later app version', async () => {
    const { repo } = await setup();
    await repo.syncSeeds(seedExercises.slice(0, 3));
    expect(await repo.syncSeeds(seedExercises)).toBe(seedExercises.length - 3);
  });

  it('maps tracking flags', async () => {
    const { repo } = await setup();
    await repo.syncSeeds(seedExercises);
    const plank = (await repo.list()).find((e) => e.name === 'Plank')!;
    expect(plank.tracks).toEqual({ weight: false, reps: false, time: true, distance: false });
    expect(plank.muscleGroup).toBe('core');
    const run = (await repo.list()).find((e) => e.name === 'Running (treadmill)')!;
    expect(run.tracks).toEqual({ weight: false, reps: false, time: true, distance: true });
    expect(run.muscleGroup).toBe('cardio');
  });

  it('creates custom exercises and rejects duplicate names', async () => {
    const { repo } = await setup();
    await repo.syncSeeds(seedExercises);
    const created = await repo.create({ name: '  Pec   deck ', muscleGroup: 'chest' });
    expect(created).toMatchObject({ name: 'Pec deck', source: 'custom', muscleGroup: 'chest' });
    await expect(repo.create({ name: 'bench PRESS', muscleGroup: 'chest' })).rejects.toBeInstanceOf(
      DuplicateExerciseError,
    );
    await expect(repo.create({ name: '  ', muscleGroup: 'chest' })).rejects.toThrow();
    expect(created.tracks).toEqual({ weight: true, reps: true, time: false, distance: false });
    // Custom cardio logs time and distance instead.
    const swim = await repo.create({ name: 'Swimming', muscleGroup: 'cardio' });
    expect(swim.tracks).toEqual({ weight: false, reps: false, time: true, distance: true });
  });
});
