import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/core/db';
import { formatClock } from '@/core/format';
import { useTranslation } from '@/core/i18n';
import { formatNumber } from '@/core/units';
import {
  createBodyweightRepository,
  createWorkoutRepository,
  type Bodyweight,
  type Workout,
} from '@/data';
import { Screen } from '@/ui';

import { MIN_SESSIONS, MIN_WEEKS, summarizeOverview, type ExerciseProgress } from './overview';
import { RangeControl, StatTile } from './StatTiles';
import { rangeStart, type Range } from './stats';

/** Workout-wide averages and which exercises moved most and least. */
export function OverviewDetail() {
  const { t } = useTranslation();
  const db = useDb();
  const [data, setData] = useState<{ workouts: Workout[]; bodyweights: Bodyweight[] } | null>(null);
  const [range, setRange] = useState<Range>('all');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void Promise.all([
      createWorkoutRepository(db).listFinished(),
      createBodyweightRepository(db).list(),
    ]).then(([workouts, bodyweights]) => active && setData({ workouts, bodyweights }));
    return () => {
      active = false;
    };
  }, [db]);

  const o = useMemo(
    () =>
      data ? summarizeOverview(data.workouts, data.bodyweights, rangeStart(range, now), now) : null,
    [data, range, now],
  );
  if (!o) return <Screen>{null}</Screen>;

  const num = (v: number | null, decimals = 1) => (v === null ? null : formatNumber(v, decimals));
  const progress = (p: ExerciseProgress | null) =>
    p ? `${p.name}  ${p.change > 0 ? '+' : ''}${formatNumber(p.change * 100, 1)}%` : null;
  const kcal = (v: number | null) =>
    v === null ? null : t('stats.kcal', { value: Math.round(v) });
  // With no workouts in range every tile is empty for the same reason, so just a dash.
  const why = (reason: string) => (o.workouts > 0 ? reason : undefined);
  const needsBodyweight = why(t('stats.needsBodyweight'));
  // Most telling first; calorie estimates are rough for lifting, so they come last.
  const tiles = [
    { label: t('stats.workouts'), value: String(o.workouts) },
    {
      label: t('stats.perWeek'),
      value: num(o.perWeek),
      reason: why(t('stats.needsWeeks', { count: MIN_WEEKS })),
    },
    {
      label: t('stats.biggestProgress'),
      value: progress(o.biggest),
      reason: why(t('stats.needsSessions', { count: MIN_SESSIONS })),
      wide: true,
    },
    {
      label: t('stats.stalled'),
      value: progress(o.smallest),
      reason: why(
        o.biggest
          ? t('stats.needsTwoExercises', { count: MIN_SESSIONS })
          : t('stats.needsSessions', { count: MIN_SESSIONS }),
      ),
      wide: true,
    },
    {
      label: t('stats.avgLength'),
      value:
        o.avgDurationMs === null
          ? null
          : t('done.minutes', { count: Math.round(o.avgDurationMs / 60_000) }),
    },
    { label: t('stats.avgSets'), value: num(o.avgWorkingSets) },
    {
      label: t('stats.avgRest'),
      value: o.avgRestS === null ? null : formatClock(o.avgRestS),
      reason: why(t('stats.noRest')),
    },
    { label: t('stats.avgCalories'), value: kcal(o.avgCalories), reason: needsBodyweight },
    { label: t('stats.totalCalories'), value: kcal(o.totalCalories), reason: needsBodyweight },
  ];

  return (
    <Screen>
      <RangeControl value={range} onChange={setRange} />
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          rowGap: 8,
        }}
      >
        {tiles.map((tile) => (
          <StatTile key={tile.label} {...tile} />
        ))}
      </View>
    </Screen>
  );
}
