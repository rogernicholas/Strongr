import type { LoggedSet } from '@/data';

import { EMPTY_SET, parseDecimal, parseWholeNumber, suggestNextSet } from '../setEntry';

const logged = (weightKg: number, reps: number, isWarmup = false): LoggedSet => ({
  id: `${weightKg}-${reps}`,
  position: 0,
  weightKg,
  reps,
  durationS: null,
  distanceM: null,
  rpe: null,
  isWarmup,
});

describe('suggestNextSet', () => {
  it('starts empty with no history', () => {
    expect(suggestNextSet([], [])).toEqual(EMPTY_SET);
  });

  it("starts from last time's first working set", () => {
    const previous = [logged(20, 10, true), logged(50, 7), logged(50, 5)];
    expect(suggestNextSet([], previous)).toMatchObject({ weightKg: 50, reps: 7, isWarmup: false });
  });

  it('copies the previous set of this session', () => {
    expect(suggestNextSet([logged(50, 7), logged(40, 8)], [logged(60, 3)])).toMatchObject({
      weightKg: 40,
      reps: 8,
    });
  });
});

describe('parsing', () => {
  it('accepts comma and dot decimals', () => {
    expect(parseDecimal('52,5')).toBe(52.5);
    expect(parseDecimal('7.5')).toBe(7.5);
  });

  it('rejects junk and negatives', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('-5')).toBeNull();
  });

  it('rounds reps', () => {
    expect(parseWholeNumber('8')).toBe(8);
    expect(parseWholeNumber('7.6')).toBe(8);
  });
});
