/** What a stats detail page shows. */
export type StatsTarget =
  | { kind: 'overview' }
  | { kind: 'bodyweight' }
  | { kind: 'exercise'; exerciseId: string; name: string };
