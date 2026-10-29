import type { LoggedSet, Workout } from '@/data';

import { exerciseProgression, PHRASES, phraseIndex, summarizeWorkout } from '../workoutSummary';

const PHRASE_COUNT = PHRASES.length;

const set = (isWarmup = false): LoggedSet => ({
  id: 's',
  position: 0,
  weightKg: 50,
  reps: 5,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup,
  completedAt: null,
  restS: null,
});

describe('workout summary', () => {
  it('never repeats a phrase twice in a row and uses every phrase', () => {
    const picks = Array.from({ length: PHRASE_COUNT * 2 }, (_, n) => phraseIndex(n));
    for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
    expect(new Set(picks.slice(0, PHRASE_COUNT)).size).toBe(PHRASE_COUNT);
    expect(picks.every((p) => p >= 0 && p < PHRASE_COUNT)).toBe(true);
  });

  it('rotates through any phrase count without repeats', () => {
    for (const count of [2, 3, 4, 12, 14, 21]) {
      const picks = Array.from({ length: count * 2 }, (_, n) => phraseIndex(n, count));
      for (let i = 1; i < picks.length; i++) expect(picks[i]).not.toBe(picks[i - 1]);
      expect(new Set(picks.slice(0, count)).size).toBe(count);
    }
  });

  it('counts duration, exercises with sets and working sets', () => {
    const exercise = (sets: LoggedSet[]) => ({
      id: 'we',
      exerciseId: 'e',
      exerciseName: 'Bench press',
      seedKey: null,
      muscleGroup: null,
      tracks: { weight: true, reps: true, time: false, distance: false },
      position: 0,
      sets,
    });
    const workout: Workout = {
      id: 'w',
      templateId: null,
      name: null,
      startedAt: 0,
      endedAt: 45 * 60_000,
      timezone: 'Europe/Prague',
      exercises: [exercise([set(true), set(), set()]), exercise([set()]), exercise([])],
    };
    expect(summarizeWorkout(workout, 80)).toEqual({
      durationMs: 45 * 60_000,
      calories: 300,
      exercises: 2,
      workingSets: 3,
    });
    expect(summarizeWorkout(workout, null).calories).toBeNull();

    // With two or more live sets, length runs from the first to the last one.
    const timed = { ...workout, exercises: [exercise([set(), set()])] };
    timed.exercises[0]!.sets[0]!.completedAt = 60_000;
    timed.exercises[0]!.sets[1]!.completedAt = 31 * 60_000;
    expect(summarizeWorkout(timed, null).durationMs).toBe(30 * 60_000);
  });

  it('compares each exercise with its previous session', () => {
    const at = (weightKg: number, reps: number) => ({ ...set(), weightKg, reps });
    const workout: Workout = {
      id: 'w',
      templateId: null,
      name: null,
      startedAt: 0,
      endedAt: 1,
      timezone: 'UTC',
      exercises: ['bench', 'row', 'curl'].map((id, i) => ({
        id: `we${i}`,
        exerciseId: id,
        exerciseName: id,
        seedKey: null,
        muscleGroup: null,
        tracks: { weight: true, reps: true, time: false, distance: false },
        position: i,
        sets: id === 'curl' ? [] : [at(60, 12), at(60, 12)],
      })),
    };
    expect(exerciseProgression(workout, { bench: [at(60, 12), at(60, 8)] })).toEqual([
      { name: 'bench', change: expect.closeTo(84 / 80 - 1, 5), first: false },
      { name: 'row', change: null, first: true },
    ]);
  });
});
