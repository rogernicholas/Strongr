import { formatClock, formatDuration, formatSetShort } from '@/core/format';

const set = (weightKg: number | null, reps: number | null, durationS: number | null = null) => ({
  weightKg,
  reps,
  durationS,
  distanceM: null,
});
const reps = (n: number) => `${n} ${n === 1 ? 'rep' : 'reps'}`;

describe('formatSetShort', () => {
  it('labels weight and reps so they cannot be mixed up', () => {
    expect(formatSetShort(set(20, 15), 'kg', reps)).toBe('20 kg × 15 reps');
    expect(formatSetShort(set(7.5, 1), 'kg', reps)).toBe('7.5 kg × 1 rep');
    expect(formatSetShort(set(100, 5), 'lb', reps)).toBe('220.46 lb × 5 reps');
    expect(formatSetShort(set(40, null), 'kg', reps)).toBe('40 kg');
  });

  it('formats bodyweight reps and timed sets', () => {
    expect(formatSetShort(set(null, 12), 'kg', reps)).toBe('12 reps');
    expect(formatSetShort(set(null, null, 90), 'kg', reps)).toBe('1:30');
    expect(formatDuration(45)).toBe('45 s');
    expect(formatClock(45.9)).toBe('0:45');
    expect(formatClock(725)).toBe('12:05');
  });
});
