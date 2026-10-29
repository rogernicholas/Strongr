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
  workoutCalories,
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
    const run = (distanceM: number) => ({ ...set(null, null), distanceM, durationS: 1800 });
    expect(sessionChange([run(5500)], [run(5000)])).toBeCloseTo(0.1);
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

  it('counts cardio with its own MET and the rest of the workout as lifting', () => {
    const HOUR = 3_600_000;
    const timed = (at: number) => ({ durationS: null, distanceM: null, completedAt: at });
    const cardio = (
      seedKey: string | null,
      durationS: number | null,
      distanceM: number | null,
    ) => ({
      seedKey,
      muscleGroup: 'cardio',
      sets: [{ durationS, distanceM, completedAt: null }],
    });
    const lifting = { seedKey: null, muscleGroup: 'chest', sets: [timed(0), timed(HOUR)] };
    const workout = (...exercises: Parameters<typeof workoutCalories>[1]['exercises']) => ({
      startedAt: 0,
      endedAt: HOUR,
      exercises,
    });

    // 1 h lifting at MET 5, 80 kg.
    expect(workoutCalories(80, workout(lifting))).toBe(400);
    // 15 min of bike (MET 7) takes 15 min off the lifting part.
    expect(workoutCalories(80, workout(lifting, cardio('stationary_bike', 900, null)))).toBeCloseTo(
      140 + 300,
    );
    // A run with distance uses 1 kcal per kg per km; a cardio-only workout has no lifting part.
    expect(workoutCalories(80, workout(cardio('treadmill_run', 1800, 5000)))).toBe(400);
    // Custom cardio without a seed: MET 7.
    expect(workoutCalories(80, workout(cardio(null, 1800, null)))).toBeCloseTo(280);
  });
});
