import {
  activeDurationMs,
  allSetsScore,
  bestE1rm,
  bodyweightFor,
  estimate1Rm,
  estimateCalories,
  sessionChange,
  sessionVolume,
  workingSets,
  workoutLengthMs,
} from '@/core/training';

const set = (weightKg: number | null, reps: number | null, isWarmup = false) => ({
  weightKg,
  reps,
  isWarmup,
});

describe('training maths', () => {
  it('estimates 1RM with Epley', () => {
    expect(estimate1Rm(100, 1)).toBe(100);
    expect(estimate1Rm(100, 5)).toBeCloseTo(116.67, 2);
    expect(estimate1Rm(0, 5)).toBeNull();
    expect(estimate1Rm(100, 0)).toBeNull();
  });

  it('drops warm-ups', () => {
    expect(workingSets([set(20, 10, true), set(60, 8)])).toEqual([set(60, 8)]);
  });

  it('rewards holding reps across sets, which best e1RM misses', () => {
    const fading = [set(60, 12), set(60, 8), set(60, 6)];
    const holding = [set(60, 12), set(60, 12), set(60, 12)];
    expect(bestE1rm(fading)).toBe(bestE1rm(holding));
    expect(allSetsScore(fading)).toBeCloseTo((84 + 76 + 72) / 3);
    expect(allSetsScore(holding)).toBeCloseTo(84);
  });

  it('sums volume of working sets', () => {
    expect(sessionVolume([set(20, 10, true), set(60, 12), set(60, 8)])).toBe(1200);
    expect(sessionVolume([set(null, 12)])).toBeNull();
    expect(allSetsScore([set(null, 12)])).toBeNull();
  });

  it('compares sessions by All sets score, or reps without weight', () => {
    expect(sessionChange([set(60, 12), set(60, 12)], [set(60, 12), set(60, 8)])).toBeCloseTo(
      84 / 80 - 1,
    );
    expect(sessionChange([set(null, 12)], [set(null, 10)])).toBeCloseTo(0.2);
    expect(sessionChange([set(60, 8)], [set(null, 10)])).toBeNull();
    expect(sessionChange([set(60, 8)], [])).toBeNull();
  });

  it('measures workout length from first to last logged set', () => {
    expect(activeDurationMs([{ completedAt: 1_000 }, { completedAt: 61_000 }])).toBe(60_000);
    expect(activeDurationMs([{ completedAt: 1_000 }, { completedAt: null }])).toBeNull();
    const workout = { startedAt: 0, endedAt: 600_000 };
    expect(workoutLengthMs(workout, [{ completedAt: 1_000 }, { completedAt: 61_000 }])).toBe(
      60_000,
    );
    expect(workoutLengthMs(workout, [{ completedAt: 1_000 }])).toBe(600_000);
    expect(workoutLengthMs({ startedAt: 0, endedAt: null }, [])).toBeNull();
  });

  it('estimates calories with MET 5', () => {
    expect(estimateCalories(80, 60 * 60 * 1000)).toBe(400);
  });

  it('picks the bodyweight logged for or before the workout week', () => {
    const entries = [
      { weekStart: '2026-10-19', weightKg: 79 },
      { weekStart: '2026-10-05', weightKg: 80 },
    ];
    expect(bodyweightFor(entries, '2026-10-12')).toBe(80);
    expect(bodyweightFor(entries, '2026-10-26')).toBe(79);
    expect(bodyweightFor(entries, '2026-09-28')).toBe(80); // before any entry: the first one
    expect(bodyweightFor([], '2026-10-12')).toBeNull();
  });
});
