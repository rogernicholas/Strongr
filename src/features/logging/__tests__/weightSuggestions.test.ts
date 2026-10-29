import type { LoggedSet, Workout } from '@/data';

import { suggestWeightIncreases } from '../weightSuggestions';

const set = (weightKg: number | null, reps: number, isWarmup = false): LoggedSet => ({
  id: `${weightKg}-${reps}`,
  position: 0,
  weightKg,
  reps,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup,
  completedAt: null,
  restS: null,
});

const workout = (...exercises: [string, LoggedSet[]][]): Workout => ({
  id: 'w',
  templateId: null,
  name: null,
  startedAt: 0,
  endedAt: 1,
  timezone: 'UTC',
  exercises: exercises.map(([name, sets], i) => ({
    id: `we${i}`,
    exerciseId: name,
    exerciseName: name,
    tracks: { weight: true, reps: true, time: false, distance: false },
    position: i,
    sets,
  })),
});

describe('suggestWeightIncreases', () => {
  it('suggests one step up when every set at the top weight hit the target', () => {
    const w = workout(
      ['Bench', [set(20, 5, true), set(60, 15), set(60, 14)]],
      ['Row', [set(50, 14), set(50, 12)]],
      ['Curl', [set(10, 15), set(12.5, 13)]], // top weight missed the target
      ['Pull-up', [set(null, 20)]], // no weight to raise
    );
    expect(suggestWeightIncreases(w, 14, 'kg')).toEqual([
      { exerciseName: 'Bench', next: '62.5 kg' },
    ]);
    expect(suggestWeightIncreases(w, 12, 'kg').map((s) => s.exerciseName)).toEqual([
      'Bench',
      'Row',
    ]);
  });

  it('works in pounds and never shows more than two', () => {
    const lb = 135 * 0.45359237;
    const w = workout(['A', [set(lb, 15)]], ['B', [set(lb, 15)]], ['C', [set(lb, 15)]]);
    const result = suggestWeightIncreases(w, 14, 'lb');
    expect(result).toHaveLength(2);
    expect(result[0]!.next).toBe('140 lb');
  });
});
