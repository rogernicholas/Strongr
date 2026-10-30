import type { Routine } from '@/data';

import { nextRoutine } from '../nextRoutine';

const routine = (id: string): Routine => ({ id, name: id, exerciseIds: [] });
const abc = [routine('A'), routine('B'), routine('C')];

describe('nextRoutine', () => {
  it('follows the last routine and wraps around', () => {
    expect(nextRoutine(abc, 'A')?.id).toBe('B');
    expect(nextRoutine(abc, 'C')?.id).toBe('A');
  });

  it('starts at the first routine without a known last one', () => {
    expect(nextRoutine(abc, null)?.id).toBe('A');
    expect(nextRoutine(abc, 'deleted')?.id).toBe('A');
  });

  it('is null without routines', () => {
    expect(nextRoutine([], 'A')).toBeNull();
  });
});
