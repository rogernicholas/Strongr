import { hasRoutineChanges } from '../routineChanges';

describe('hasRoutineChanges', () => {
  it('is false when the selection matches the routine exactly', () => {
    expect(hasRoutineChanges(['a', 'b'], ['a', 'b'])).toBe(false);
    expect(hasRoutineChanges([], [])).toBe(false);
  });

  it('detects added, removed and reordered exercises', () => {
    expect(hasRoutineChanges(['a', 'b'], ['a', 'b', 'c'])).toBe(true);
    expect(hasRoutineChanges(['a', 'b'], ['a'])).toBe(true);
    expect(hasRoutineChanges(['a', 'b'], ['b', 'a'])).toBe(true);
  });
});
