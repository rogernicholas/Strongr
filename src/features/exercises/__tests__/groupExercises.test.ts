import type { Exercise } from '@/data';

import { groupExercises } from '../groupExercises';

const ex = (name: string, muscleGroup: Exercise['muscleGroup']): Exercise => ({
  id: name,
  name,
  muscleGroup,
  source: 'seed',
  tracks: { weight: true, reps: true, time: false, distance: false },
});

const all = [
  ex('Lateral raise', 'shoulders'),
  ex('Bench press', 'chest'),
  ex('Incline bench press', 'chest'),
  ex('Cable row', 'back'),
  ex('Mystery', null),
];

describe('groupExercises', () => {
  it('groups in muscle-group order with unknowns last', () => {
    expect(groupExercises(all).map((s) => s.key)).toEqual(['chest', 'back', 'shoulders', 'other']);
  });

  it('sorts by name within a group', () => {
    expect(groupExercises(all)[0]!.data.map((e) => e.name)).toEqual([
      'Bench press',
      'Incline bench press',
    ]);
  });

  it('matches every word of the query, case-insensitively', () => {
    const result = groupExercises(all, 'BENCH incl');
    expect(result.flatMap((s) => s.data.map((e) => e.name))).toEqual(['Incline bench press']);
  });
});
