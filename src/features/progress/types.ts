/** What a stats detail page shows. */
export type StatsTarget =
  { kind: 'bodyweight' } | { kind: 'exercise'; exerciseId: string; name: string };
