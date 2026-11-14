/** @jest-environment node */
import { seedExercises } from '@/config/seedExercises';
import { migrate, migrations } from '@/core/db';
import { createExerciseRepository, createRoutineRepository, followOrder } from '@/data';

import { openNodeDb } from './helpers/nodeDb';

async function setup() {
  const db = openNodeDb();
  await migrate(db, migrations);
  const exercises = createExerciseRepository(db);
  await exercises.syncSeeds(seedExercises);
  const all = await exercises.list();
  const id = (name: string) => all.find((e) => e.name === name)!.id;
  return { db, repo: createRoutineRepository(db), id };
}

describe('routineRepository', () => {
  it('saves a routine and keeps exercise order', async () => {
    const { repo, id } = await setup();
    const order = [id('Bench press'), id('Bent-over row (barbell)'), id('Triceps pushdown')];
    await repo.create(' A ', order);
    const [routine] = await repo.list();
    expect(routine).toMatchObject({ name: 'A', exerciseIds: order });
  });

  it('updates name and exercises', async () => {
    const { repo, id } = await setup();
    const created = await repo.create('A', [id('Bench press')]);
    await repo.update(created.id, { name: 'Push', exerciseIds: [id('Dips'), id('Bench press')] });
    const [routine] = await repo.list();
    expect(routine).toMatchObject({ name: 'Push', exerciseIds: [id('Dips'), id('Bench press')] });
  });

  it('soft-deletes', async () => {
    const { db, repo, id } = await setup();
    const created = await repo.create('A', [id('Bench press')]);
    await repo.remove(created.id);
    expect(await repo.list()).toEqual([]);
    expect(await db.getAll('SELECT * FROM templates')).toHaveLength(1);
  });

  it('hides deleted exercises from a routine', async () => {
    const { db, repo, id } = await setup();
    await repo.create('A', [id('Bench press'), id('Dips')]);
    await db.run('UPDATE exercises SET deleted_at = 1 WHERE id = ?', [id('Dips')]);
    const [routine] = await repo.list();
    expect(routine!.exerciseIds).toEqual([id('Bench press')]);
  });

  it('follows a workout order, keeping exercises the workout lacks in their slots', () => {
    expect(followOrder(['A', 'B', 'C', 'D'], ['C', 'X', 'A'])).toEqual(['C', 'B', 'A', 'D']);
    expect(followOrder(['A', 'B', 'C'], ['C', 'B', 'A'])).toEqual(['C', 'B', 'A']);
    expect(followOrder(['A', 'B'], ['X'])).toEqual(['A', 'B']);
    expect(followOrder(['A', 'B', 'A'], ['B', 'A'])).toEqual(['B', 'A', 'A']);
  });

  it('remembers a workout order without replacing rows', async () => {
    const { db, repo, id } = await setup();
    const created = await repo.create('A', [id('Bench press'), id('Dips'), id('Squat')]);
    await repo.followWorkoutOrder(created.id, [id('Squat'), id('Bench press')]);
    const [routine] = await repo.list();
    expect(routine!.exerciseIds).toEqual([id('Squat'), id('Dips'), id('Bench press')]);
    expect(await db.getAll('SELECT * FROM template_exercises')).toHaveLength(3);
  });

  it('requires a name', async () => {
    const { repo } = await setup();
    await expect(repo.create('  ', [])).rejects.toThrow();
  });
});
