import type { LoggedSet, Workout } from '@/data';

import { buildTxtExport, formatSetsLine } from '../buildTxtExport';

let n = 0;
const s = (weightKg: number | null, reps: number | null, extra: Partial<LoggedSet> = {}) => ({
  id: `s${n++}`,
  position: n,
  weightKg,
  reps,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup: false,
  ...extra,
});

const tracks = { weight: true, reps: true, time: false, distance: false };

describe('formatSetsLine', () => {
  it("matches Roger's notepad style", () => {
    expect(formatSetsLine([s(50, 7), s(50, 5), s(50, 4), s(40, 8)], 'kg')).toBe(
      '50: 7, 5, 4; 40: 8',
    );
    expect(formatSetsLine([s(7.5, 10), s(7.5, 8), s(5, 12)], 'kg')).toBe('7.5: 10, 8; 5: 12');
  });

  it('handles bodyweight, warm-ups, RPE and timed sets', () => {
    expect(formatSetsLine([s(null, 12), s(null, 10)], 'kg')).toBe('12, 10');
    expect(formatSetsLine([s(20, 10, { isWarmup: true }), s(50, 5, { rpe: 8.5 })], 'kg')).toBe(
      '20: 10w; 50: 5@8.5',
    );
    expect(formatSetsLine([s(null, null, { durationS: 60 })], 'kg')).toBe('1:00');
  });

  it('converts to lb', () => {
    expect(formatSetsLine([s(100, 5)], 'lb')).toBe('220.46: 5');
  });
});

describe('buildTxtExport', () => {
  const workout = (
    startedAt: number,
    name: string | null,
    exercises: Workout['exercises'],
  ): Workout => ({
    id: `w${startedAt}`,
    templateId: null,
    name,
    startedAt,
    endedAt: startedAt + 3_600_000,
    timezone: 'Europe/Prague',
    exercises,
  });
  const ex = (name: string, sets: LoggedSet[]) => ({
    id: name,
    exerciseId: name,
    exerciseName: name,
    tracks,
    position: 0,
    sets,
  });

  it('writes one block per day with weekly bodyweight once per week', () => {
    const mon = new Date(2026, 9, 12, 18).getTime();
    const wed = new Date(2026, 9, 14, 18).getTime();
    const text = buildTxtExport(
      [
        workout(wed, 'B', [ex('Pulldown', [s(50, 12)])]),
        workout(mon, 'A', [ex('Bench press', [s(50, 7), s(40, 8)]), ex('Skipped', [])]),
      ],
      [{ weekStart: '2026-10-12', weightKg: 76.9 }],
      {
        unit: 'kg',
        formatDay: (d) => d.toDateString(),
        labels: {
          header: 'Strongr export (kg)',
          bodyweight: 'Bodyweight',
          warmupNote: 'w = warm-up',
        },
      },
    );
    expect(text).toBe(
      [
        'Strongr export (kg)',
        'w = warm-up',
        '',
        `${new Date(mon).toDateString()} · A`,
        'Bodyweight: 76.9 kg',
        'Bench press 50: 7; 40: 8',
        '',
        `${new Date(wed).toDateString()} · B`,
        'Pulldown 50: 12',
        '',
      ].join('\n'),
    );
  });
});
