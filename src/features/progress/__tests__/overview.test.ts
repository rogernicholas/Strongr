import type { LoggedSet, Workout } from '@/data';

import { summarizeOverview } from '../overview';

const DAY = 24 * 60 * 60 * 1000;
const MIN = 60 * 1000;

let n = 0;
const set = (
  weightKg: number | null,
  reps: number | null,
  extra: Partial<LoggedSet> = {},
): LoggedSet => ({
  id: `s${n++}`,
  position: 0,
  weightKg,
  reps,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup: false,
  completedAt: null,
  restS: null,
  ...extra,
});

const tracks = { weight: true, reps: true, time: false, distance: false };
const workout = (day: number, exercises: [string, LoggedSet[]][]): Workout => ({
  id: `w${day}`,
  templateId: null,
  name: null,
  startedAt: day * DAY,
  endedAt: day * DAY + 60 * MIN,
  timezone: 'UTC',
  exercises: exercises.map(([name, sets], i) => ({
    id: `${day}-${i}`,
    exerciseId: name,
    exerciseName: name,
    tracks,
    position: i,
    sets,
  })),
});

describe('summarizeOverview', () => {
  it('averages length, sets and logged rest', () => {
    const start = 10 * DAY;
    const workouts = [
      workout(10, [
        [
          'Bench',
          [
            set(20, 10, { isWarmup: true, completedAt: start }),
            set(60, 8, { completedAt: start + 10 * MIN, restS: 90 }),
            set(60, 8, { completedAt: start + 40 * MIN, restS: 150 }),
          ],
        ],
      ]),
      // Edited in later: no times, so it doesn't count for length.
      workout(12, [['Bench', [set(60, 8)]]]),
    ];
    const o = summarizeOverview(workouts, 0, 24 * DAY);
    expect(o.workouts).toBe(2);
    expect(o.perWeek).toBeCloseTo(1); // 2 workouts over 2 weeks
    expect(o.avgDurationMs).toBe(40 * MIN);
    expect(o.avgWorkingSets).toBe(1.5);
    expect(o.avgRestS).toBe(120);
    expect(summarizeOverview(workouts, 11 * DAY, 24 * DAY).workouts).toBe(1);
  });

  it('ranks exercises by progress in their chart metric', () => {
    const fading = [set(60, 12), set(60, 8), set(60, 6)];
    const holding = [set(60, 12), set(60, 12), set(60, 12)];
    const workouts = [1, 2, 3, 4].map((d) => {
      const exercises: [string, LoggedSet[]][] = [
        ['Bench', d <= 2 ? fading : holding],
        ['Squat', [set(100, 5)]],
        ['Pull-up', [set(null, d <= 2 ? 10 : 8)]],
      ];
      // Only three sessions: too few to judge, so it's left out.
      if (d < 4) exercises.push(['Curl', [set(10, 10)]]);
      return workout(d, exercises);
    });
    const o = summarizeOverview(workouts, 0, 5 * DAY);
    expect(o.biggest?.name).toBe('Bench');
    expect(o.biggest?.change).toBeCloseTo(84 / 77.333 - 1, 3);
    expect(o.smallest).toEqual({ name: 'Pull-up', change: -0.2 });
  });

  it('is empty without workouts', () => {
    expect(summarizeOverview([], 0, DAY)).toEqual({
      workouts: 0,
      perWeek: null,
      avgDurationMs: null,
      avgWorkingSets: null,
      avgRestS: null,
      biggest: null,
      smallest: null,
    });
  });
});
