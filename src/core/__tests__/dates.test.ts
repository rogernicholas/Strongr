import { localDateKey, monthGrid, parseDateKey, weekStartKey } from '@/core/dates';

describe('dates', () => {
  it('formats local date keys', () => {
    expect(localDateKey(new Date(2026, 9, 5))).toBe('2026-10-05');
    expect(localDateKey(parseDateKey('2026-01-31'))).toBe('2026-01-31');
  });

  it('weeks start on Monday', () => {
    expect(weekStartKey(new Date(2026, 9, 15))).toBe('2026-10-12'); // Thursday
    expect(weekStartKey(new Date(2026, 9, 12))).toBe('2026-10-12'); // Monday
    expect(weekStartKey(new Date(2026, 9, 18))).toBe('2026-10-12'); // Sunday
    expect(weekStartKey(new Date(2027, 0, 2))).toBe('2026-12-28'); // across years
  });

  it('builds a Monday-first month grid', () => {
    const grid = monthGrid(2026, 9); // October 2026 starts on a Thursday
    expect(grid[0]!.slice(0, 3)).toEqual([null, null, null]);
    expect(grid[0]![3]!.getDate()).toBe(1);
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(grid.flat().filter(Boolean)).toHaveLength(31);
  });
});
