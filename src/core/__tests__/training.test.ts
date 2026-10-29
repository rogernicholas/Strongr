import { allSetsScore, bestE1rm, estimate1Rm, sessionVolume, workingSets } from '@/core/training';

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
});
