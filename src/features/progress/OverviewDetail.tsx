import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/core/db';
import { formatClock } from '@/core/format';
import { useTranslation } from '@/core/i18n';
import { formatNumber } from '@/core/units';
import { createWorkoutRepository, type Workout } from '@/data';
import { Screen } from '@/ui';

import { summarizeOverview, type ExerciseProgress } from './overview';
import { DASH, RangeControl, StatTile } from './StatTiles';
import { rangeStart, type Range } from './stats';

/** Workout-wide averages and which exercises moved most and least. */
export function OverviewDetail() {
  const { t } = useTranslation();
  const db = useDb();
  const [workouts, setWorkouts] = useState<Workout[] | null>(null);
  const [range, setRange] = useState<Range>('all');
  const [now] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    void createWorkoutRepository(db)
      .listFinished()
      .then((w) => active && setWorkouts(w));
    return () => {
      active = false;
    };
  }, [db]);

  const o = useMemo(
    () => (workouts ? summarizeOverview(workouts, rangeStart(range, now), now) : null),
    [workouts, range, now],
  );
  if (!o) return <Screen>{null}</Screen>;

  const num = (v: number | null, decimals = 1) => (v === null ? DASH : formatNumber(v, decimals));
  const progress = (p: ExerciseProgress | null) =>
    p ? `${p.name}  ${p.change > 0 ? '+' : ''}${formatNumber(p.change * 100, 1)}%` : DASH;
  const tiles = [
    { label: t('stats.workouts'), value: String(o.workouts) },
    { label: t('stats.perWeek'), value: num(o.perWeek) },
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
