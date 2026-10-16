import type { LoggedSet, Workout } from '@/data';

import { PHRASES, phraseIndex, summarizeWorkout } from '../workoutSummary';

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
    expect(summarizeWorkout(workout)).toEqual({
      durationMs: 45 * 60_000,
      exercises: 2,
      workingSets: 3,
    });
  });
});
