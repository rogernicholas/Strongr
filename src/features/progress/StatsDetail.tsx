import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';

import { formatShortDate } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { formatNumber, toDisplayWeight } from '@/core/units';
import { useFormatSet } from '@/core/useFormatSet';
import {
  createBodyweightRepository,
  createWorkoutRepository,
  type Bodyweight,
  type ExerciseSession,
} from '@/data';
import { AppText, Card, LineChart, Screen, SegmentedControl } from '@/ui';

import {
  bodyweightPoints,
  changeOver,
  defaultMetric,
  exercisePoints,
  inRange,
  summarizeBodyweight,
  summarizeExercise,
  type Metric,
  type Range,
} from './stats';
import type { StatsTarget } from './types';

const DASH = '–';

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: '48.5%' }}>
      <Card>
        <AppText variant="label">{label.toUpperCase()}</AppText>
        <AppText variant="stat">{value}</AppText>
      </Card>
    </View>
  );
}

/** Graph plus stats for one exercise or for bodyweight. */
export function StatsDetail({ target }: { target: StatsTarget }) {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const formatSet = useFormatSet();
  const [sessions, setSessions] = useState<ExerciseSession[] | null>(null);
  const [bodyweights, setBodyweights] = useState<Bodyweight[] | null>(null);
  const [range, setRange] = useState<Range>('all');
  const [metric, setMetric] = useState<Metric | null>(null);
  const [now] = useState(() => Date.now());
  const exerciseId = target.kind === 'exercise' ? target.exerciseId : null;

  useEffect(() => {
    let active = true;
    if (exerciseId) {
      void createWorkoutRepository(db)
        .exerciseSessions(exerciseId)
        .then((s) => {
          if (!active) return;
          setSessions(s);
          setMetric(defaultMetric(s));
        });
    } else {
      void createBodyweightRepository(db)
        .list()
        .then((b) => active && setBodyweights(b));
    }
    return () => {
      active = false;
    };
  }, [db, exerciseId]);

  const allPoints = useMemo(() => {
    if (exerciseId) return sessions && metric ? exercisePoints(sessions, metric) : [];
    return bodyweights ? bodyweightPoints(bodyweights) : [];
  }, [exerciseId, sessions, metric, bodyweights]);

  if (exerciseId ? sessions === null : bodyweights === null) return <Screen>{null}</Screen>;

  const points = inRange(allPoints, range, now);
  const isReps = metric === 'reps';
  const weight = (kg: number) => `${formatNumber(toDisplayWeight(kg, unit), 1)} ${unit}`;
  const formatValue = (v: number) => (isReps ? formatNumber(v, 0) : weight(v));
  const change = changeOver(allPoints, 28);
  const signedChange = change === null ? DASH : `${change > 0 ? '+' : ''}${formatValue(change)}`;
  const orDash = (v: number | null) => (v === null ? DASH : weight(v));

  let tiles: { label: string; value: string }[];
  if (exerciseId) {
    const s = summarizeExercise(sessions ?? []);
    tiles = [
      { label: t('stats.bestSet'), value: s.bestSet ? formatSet(s.bestSet) : DASH },
      { label: t('stats.e1rm'), value: orDash(s.bestE1rm) },
      { label: t('stats.sessions'), value: String(s.sessions) },
      {
        label: t('stats.lastSession'),
        value: s.lastAt === null ? DASH : formatShortDate(new Date(s.lastAt), i18n.language),
      },
      { label: t('stats.change4w'), value: signedChange },
    ];
  } else {
    const s = summarizeBodyweight(allPoints);
    tiles = [
      { label: t('stats.current'), value: orDash(s.current) },
      { label: t('stats.change4w'), value: signedChange },
      { label: t('stats.lowest'), value: orDash(s.lowest) },
      { label: t('stats.highest'), value: orDash(s.highest) },
    ];
  }

  return (
    <Screen>
      {metric === 'allSets' || metric === 'volume' ? (
        <SegmentedControl<Metric>
          accessibilityLabel={t('stats.metric')}
          value={metric}
          onChange={setMetric}
          options={[
            { value: 'allSets', label: t('stats.allSets') },
            { value: 'volume', label: t('stats.volume') },
          ]}
        />
      ) : null}

      <Card>
        {points.length === 0 ? (
          <AppText variant="muted" style={{ paddingVertical: 48, textAlign: 'center' }}>
            {t('stats.noChartData')}
          </AppText>
        ) : (
          <LineChart
            points={points.map((p) => ({ x: p.t, y: p.value }))}
            formatX={(x) => formatShortDate(new Date(x), i18n.language)}
            formatY={formatValue}
            accessibilityLabel={t('stats.chartLabel', {
              count: points.length,
              latest: formatValue(points[points.length - 1]!.value),
            })}
          />
        )}
      </Card>

      <SegmentedControl<Range>
        accessibilityLabel={t('stats.range')}
        value={range}
        onChange={setRange}
        options={[
          { value: '3m', label: t('stats.range3m') },
          { value: '1y', label: t('stats.range1y') },
          { value: 'all', label: t('stats.rangeAll') },
        ]}
      />

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
