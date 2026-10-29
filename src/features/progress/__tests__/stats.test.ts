import type { ExerciseSession, LoggedSet } from '@/data';

import {
  bodyweightPoints,
  changeOver,
  defaultMetric,
  exercisePoints,
  inRange,
  summarizeBodyweight,
  summarizeExercise,
} from '../stats';

const DAY = 24 * 60 * 60 * 1000;

let n = 0;
const set = (weightKg: number | null, reps: number | null, isWarmup = false): LoggedSet => ({
  id: `s${n++}`,
  position: 0,
  weightKg,
  reps,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup,
});

const session = (day: number, sets: LoggedSet[]): ExerciseSession => ({
  workoutId: `w${day}`,
  startedAt: day * DAY,
  sets,
});

describe('stats', () => {
  it('plots the All sets score per session, ignoring warm-ups', () => {
    const sessions = [
      session(1, [set(80, 5, true), set(60, 12), set(60, 8), set(60, 6)]),
      session(8, [set(60, 12), set(60, 12), set(60, 12)]),
    ];
    expect(defaultMetric(sessions)).toBe('allSets');
    const [before, after] = exercisePoints(sessions, 'allSets').map((p) => p.value);
    expect(before).toBeCloseTo(77.33, 2);
    expect(after).toBeCloseTo(84);
    expect(exercisePoints(sessions, 'volume').map((p) => p.value)).toEqual([1560, 2160]);
  });

  it('falls back to reps for exercises logged without weight', () => {
    const sessions = [session(1, [set(null, 12), set(null, 15)])];
    expect(defaultMetric(sessions)).toBe('reps');
    expect(exercisePoints(sessions, 'reps')).toEqual([{ t: DAY, value: 15 }]);
    expect(exercisePoints(sessions, 'allSets')).toEqual([]);
  });

  it('summarizes best set, best e1RM and sessions', () => {
    const summary = summarizeExercise([
      session(1, [set(100, 3), set(100, 5)]),
      session(8, [set(90, 10), set(120, 1, true)]),
    ]);
    expect(summary.bestSet).toMatchObject({ weightKg: 100, reps: 5 });
    expect(summary.bestE1rm).toBeCloseTo(120); // 90 × 10 beats 100 × 5
    expect(summary.sessions).toBe(2);
    expect(summary.lastAt).toBe(8 * DAY);
  });

  it('filters by range and measures change over four weeks', () => {
    const points = [0, 10, 30, 40].map((d, i) => ({ t: d * DAY, value: 80 + i }));
    expect(inRange(points, '3m', 90 * DAY).map((p) => p.value)).toEqual([80, 81, 82, 83]);
    expect(inRange(points, '3m', 95 * DAY).map((p) => p.value)).toEqual([81, 82, 83]);
    expect(changeOver(points, 28)).toBe(2); // 83 vs the point on day 10
    expect(changeOver(points.slice(0, 1), 28)).toBeNull();
  });

  it('still finds the entry four weeks back across a daylight-saving switch', () => {
    // Spring forward makes four calendar weeks one hour short of 28 days.
    const points = [
      { t: 0, value: 80 },
      { t: 28 * DAY - 60 * 60 * 1000, value: 78 },
    ];
    expect(changeOver(points, 28)).toBe(-2);
  });

  it('summarizes bodyweight entries in week order', () => {
    const points = bodyweightPoints([
      { weekStart: '2026-10-12', weightKg: 77 },
      { weekStart: '2026-10-05', weightKg: 78 },
    ]);
    expect(points.map((p) => p.value)).toEqual([78, 77]);
    expect(summarizeBodyweight(points)).toEqual({ current: 77, lowest: 77, highest: 78 });
  });
});
