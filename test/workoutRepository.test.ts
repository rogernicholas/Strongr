/** @jest-environment node */
import { seedExercises } from '@/config/seedExercises';
import { migrate, migrations } from '@/core/db';
import { createExerciseRepository, createWorkoutRepository, type SetInput } from '@/data';

import { openNodeDb } from './helpers/nodeDb';

const set = (weightKg: number | null, reps: number | null, extra: Partial<SetInput> = {}) => ({
  weightKg,
  reps,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup: false,
  ...extra,
});

async function setup() {
  const db = openNodeDb();
  await migrate(db, migrations);
  const exercises = createExerciseRepository(db);
  await exercises.syncSeeds(seedExercises);
  const all = await exercises.list();
  const id = (name: string) => all.find((e) => e.name === name)!.id;
  let now = 1_000;
  const repo = createWorkoutRepository(db, () => (now += 1_000));
  return { db, repo, id };
}

describe('workoutRepository', () => {
  it('starts a workout with exercises in order and logs sets', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press'), id('Row machine')] });
    let workout = (await repo.get(workoutId))!;
    expect(workout.exercises.map((e) => e.exerciseName)).toEqual(['Bench press', 'Row machine']);
    expect(workout.endedAt).toBeNull();

    const bench = workout.exercises[0]!.id;
    await repo.addSet(bench, set(50, 7));
    await repo.addSet(bench, set(50, 5));
    await repo.addSet(bench, set(40, 8));
    workout = (await repo.get(workoutId))!;
    expect(workout.exercises[0]!.sets.map((s) => [s.position, s.weightKg, s.reps])).toEqual([
      [0, 50, 7],
      [1, 50, 5],
      [2, 40, 8],
    ]);
  });

  it('edits and deletes sets', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press')] });
    const we = (await repo.get(workoutId))!.exercises[0]!.id;
    const first = await repo.addSet(we, set(50, 7));
    const second = await repo.addSet(we, set(50, 5));
    await repo.updateSet(first.id, set(52.5, 6, { isWarmup: true }));
    await repo.deleteSet(second.id);
    const sets = (await repo.get(workoutId))!.exercises[0]!.sets;
    expect(sets).toEqual([expect.objectContaining({ weightKg: 52.5, reps: 6, isWarmup: true })]);
  });

  it('rejects empty sets', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press')] });
    const we = (await repo.get(workoutId))!.exercises[0]!.id;
    await expect(repo.addSet(we, set(null, null))).rejects.toThrow();
  });

  it('tracks the active workout and finishes it', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press')] });
    expect(await repo.findActive()).toBe(workoutId);
    const we = (await repo.get(workoutId))!.exercises[0]!.id;
    await repo.addSet(we, set(50, 7));
    expect(await repo.finish(workoutId)).toBe('saved');
    expect(await repo.findActive()).toBeNull();
    expect((await repo.get(workoutId))!.endedAt).not.toBeNull();
  });

  it('closes a workout left open when a new one starts', async () => {
    const { repo, id } = await setup();
    const first = await repo.start({ exerciseIds: [id('Bench press')] });
    await repo.addSet((await repo.get(first))!.exercises[0]!.id, set(50, 7));
    const second = await repo.start({ exerciseIds: [id('Squat')] });
    expect(await repo.findActive()).toBe(second);
    expect((await repo.get(first))!.endedAt).not.toBeNull();
  });

  it('discards a finished workout with no sets', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press')] });
    expect(await repo.finish(workoutId)).toBe('discarded');
    expect(await repo.get(workoutId)).toBeNull();
  });

  it('adds exercises mid-workout at the end', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press')] });
    await repo.addExercises(workoutId, [id('Dips')]);
    const names = (await repo.get(workoutId))!.exercises.map((e) => e.exerciseName);
    expect(names).toEqual(['Bench press', 'Dips']);
  });

  it('removes an exercise with its sets mid-workout', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press'), id('Row machine')] });
    const [bench, row] = (await repo.get(workoutId))!.exercises;
    await repo.addSet(bench!.id, set(50, 7));
    await repo.addSet(row!.id, set(40, 10));
    await repo.removeExercise(bench!.id);
    const workout = (await repo.get(workoutId))!;
    expect(workout.exercises.map((e) => e.exerciseName)).toEqual(['Row machine']);
    expect(await repo.previousSets(id('Bench press'), 'none')).toEqual([]);
    await repo.removeExercise(row!.id);
    expect(await repo.finish(workoutId)).toBe('discarded');
  });

  it('finds the previous session for an exercise, skipping workouts without it', async () => {
    const { repo, id } = await setup();
    const bench = id('Bench press');

    const w1 = await repo.start({ exerciseIds: [bench] });
    await repo.addSet((await repo.get(w1))!.exercises[0]!.id, set(45, 8));
    await repo.finish(w1);

    const w2 = await repo.start({ exerciseIds: [bench, id('Dips')] });
    const w2ex = (await repo.get(w2))!.exercises;
    await repo.addSet(w2ex[0]!.id, set(50, 7));
    await repo.addSet(w2ex[0]!.id, set(40, 8));
    await repo.finish(w2);

    // A later workout that has bench selected but no sets logged for it.
    const w3 = await repo.start({ exerciseIds: [bench, id('Dips')] });
    await repo.addSet((await repo.get(w3))!.exercises[1]!.id, set(null, 10));
    await repo.finish(w3);

    const w4 = await repo.start({ exerciseIds: [bench] });
    const previous = await repo.previousSets(bench, w4);
    expect(previous.map((s) => [s.weightKg, s.reps])).toEqual([
      [50, 7],
      [40, 8],
    ]);
    expect(await repo.previousSets(id('Squat'), w4)).toEqual([]);
  });
});

describe('workoutRepository history', () => {
  it('lists finished workouts in a range and removes them', async () => {
    const db = openNodeDb();
    await migrate(db, migrations);
    const exercises = createExerciseRepository(db);
    await exercises.syncSeeds(seedExercises);
    const bench = (await exercises.list()).find((e) => e.name === 'Bench press')!.id;
    let now = 0;
    const repo = createWorkoutRepository(db, () => now);

    now = 1_000;
    const a = await repo.start({ exerciseIds: [bench] });
    await repo.addSet((await repo.get(a))!.exercises[0]!.id, set(50, 7));
    await repo.finish(a);
    now = 5_000;
    const b = await repo.start({ exerciseIds: [bench] });
    await repo.addSet((await repo.get(b))!.exercises[0]!.id, set(50, 8));
    await repo.finish(b);
    now = 9_000;
    await repo.start({ exerciseIds: [bench] }); // still running: not history

    const listed = await repo.listFinished();
    expect(listed.map((w) => w.id)).toEqual([a, b]);
    // Each workout gets only its own exercises and sets.
    expect(listed.map((w) => w.exercises[0]!.sets.map((s) => s.reps))).toEqual([[7], [8]]);
    expect((await repo.listFinished(2_000, 6_000)).map((w) => w.id)).toEqual([b]);
    await repo.remove(a);
    expect((await repo.listFinished()).map((w) => w.id)).toEqual([b]);
  });
});

describe('workoutRepository stats queries', () => {
  it('lists logged exercises and their sessions, ignoring unfinished and deleted workouts', async () => {
    const { repo, id } = await setup();
    const bench = id('Bench press');
    const row = id('Row machine');

    const log = async (exerciseId: string, sets: SetInput[]) => {
      const workoutId = await repo.start({ exerciseIds: [exerciseId] });
      const we = (await repo.get(workoutId))!.exercises[0]!.id;
      for (const s of sets) await repo.addSet(we, s);
      return workoutId;
    };

    const first = await log(bench, [set(50, 8), set(55, 5)]);
    await repo.finish(first);
    const second = await log(bench, [set(57.5, 5)]);
    await repo.finish(second);
    const deleted = await log(row, [set(40, 10)]);
    await repo.finish(deleted);
    await repo.remove(deleted);
    await log(row, [set(45, 10)]); // still open

    expect(await repo.countFinished()).toBe(2);
    expect(await repo.loggedExercises()).toEqual([
      expect.objectContaining({ exerciseId: bench, name: 'Bench press', sessions: 2 }),
    ]);
    const sessions = await repo.exerciseSessions(bench);
    expect(sessions.map((s) => s.workoutId)).toEqual([first, second]);
    expect(sessions[0]!.sets.map((s) => s.weightKg)).toEqual([50, 55]);
  });

  it('leaves out exercises that only have warm-up sets', async () => {
    const { repo, id } = await setup();
    const workoutId = await repo.start({ exerciseIds: [id('Bench press'), id('Row machine')] });
    const [bench, row] = (await repo.get(workoutId))!.exercises;
    await repo.addSet(bench!.id, set(50, 5));
    await repo.addSet(row!.id, set(20, 10, { isWarmup: true }));
    await repo.finish(workoutId);

    expect((await repo.loggedExercises()).map((e) => e.name)).toEqual(['Bench press']);
  });
});
