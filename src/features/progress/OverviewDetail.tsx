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
import { AppText, Screen } from '@/ui';

import { summarizeOverview, type ExerciseProgress } from './overview';
import { DASH, RangeControl, StatTile } from './StatTiles';
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

  const num = (v: number | null, decimals = 1) => (v === null ? DASH : formatNumber(v, decimals));
  const progress = (p: ExerciseProgress | null) =>
    p ? `${p.name}  ${p.change > 0 ? '+' : ''}${formatNumber(p.change * 100, 1)}%` : DASH;
  const kcal = (v: number | null) =>
    v === null ? DASH : t('stats.kcal', { value: Math.round(v) });
  const tiles = [
    { label: t('stats.workouts'), value: String(o.workouts) },
    { label: t('stats.perWeek'), value: num(o.perWeek) },
    { label: t('stats.avgCalories'), value: kcal(o.avgCalories) },
    { label: t('stats.totalCalories'), value: kcal(o.totalCalories) },
    {
      label: t('stats.avgLength'),
      value:
        o.avgDurationMs === null
          ? DASH
          : t('done.minutes', { count: Math.round(o.avgDurationMs / 60_000) }),
    },
    { label: t('stats.avgSets'), value: num(o.avgWorkingSets) },
    { label: t('stats.avgRest'), value: o.avgRestS === null ? DASH : formatClock(o.avgRestS) },
  ];

  return (
    <Screen>
      <RangeControl value={range} onChange={setRange} />
      {o.workouts > 0 && data?.bodyweights.length === 0 ? (
        <AppText variant="muted">{t('stats.caloriesNeedBodyweight')}</AppText>
      ) : null}
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
        <StatTile wide label={t('stats.biggestProgress')} value={progress(o.biggest)} />
        <StatTile wide label={t('stats.smallestProgress')} value={progress(o.smallest)} />
      </View>
    </Screen>
  );
}
