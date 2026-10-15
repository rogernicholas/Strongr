import { formatDuration, formatSetShort } from '@/core/format';

const set = (weightKg: number | null, reps: number | null, durationS: number | null = null) => ({
  weightKg,
  reps,
  durationS,
  distanceM: null,
});

describe('formatSetShort', () => {
  it('formats weight × reps in the chosen unit', () => {
    expect(formatSetShort(set(50, 7), 'kg')).toBe('50 × 7');
    expect(formatSetShort(set(7.5, 10), 'kg')).toBe('7.5 × 10');
    expect(formatSetShort(set(100, 5), 'lb')).toBe('220.46 × 5');
  });

  it('formats bodyweight reps and timed sets', () => {
    expect(formatSetShort(set(null, 12), 'kg')).toBe('× 12');
    expect(formatSetShort(set(null, null, 90), 'kg')).toBe('1:30');
    expect(formatDuration(45)).toBe('45 s');
  });
});
