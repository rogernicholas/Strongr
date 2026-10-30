import { useEffect, useState, type ReactNode } from 'react';
import { View } from 'react-native';

import { formatShortDate, weekStartKey } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { formatNumber, fromDisplayWeight, toDisplayWeight } from '@/core/units';
import {
  createBodyweightRepository,
  createWorkoutRepository,
  type Bodyweight,
  type LoggedExercise,
  type Workout,
} from '@/data';
import { AppText, BodyweightDialog, Card, LinkButton, Sparkline, useDialog } from '@/ui';

import { sessionsByExercise, summarizeOverview, type Overview } from './overview';
import { defaultMetric, exercisePoints, type Metric } from './stats';
import type { StatsTarget } from './types';

interface Props {
  onOpen(target: StatsTarget): void;
  /** Change this to reload, e.g. when the screen regains focus. */
  reloadToken?: number;
  /** Called after a change here (bodyweight) so other pages can refresh. */
  onChanged?(): void;
}

interface Trend {
  metric: Metric;
  values: number[];
}

/** Each exercise's chart values per session, oldest first. */
function trendsOf(workouts: readonly Workout[]): Map<string, Trend> {
  const trends = new Map<string, Trend>();
  for (const [id, { sessions }] of sessionsByExercise(workouts)) {
    const metric = defaultMetric(sessions);
    if (!metric) continue;
    trends.set(id, { metric, values: exercisePoints(sessions, metric).map((p) => p.value) });
  }
  return trends;
}

const signed = (text: string, value: number) => `${value > 0 ? '+' : ''}${text}`;

/** A card title with a trend line and the latest change at the right. */
function TrendRow({
  title,
  values,
  change,
}: {
  title: ReactNode;
  values: number[];
  change: string | null;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ flex: 1 }}>{title}</View>
      <Sparkline values={values} />
      {change ? (
        <AppText variant="muted" style={{ minWidth: 64, textAlign: 'right' }}>
          {change}
        </AppText>
      ) : null}
    </View>
  );
}

/** Overview and bodyweight first, then every exercise that has been logged. */
export function StatsList({ onOpen, reloadToken, onChanged }: Props) {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const dialog = useDialog();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [bodyweights, setBodyweights] = useState<Bodyweight[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);
  const [trends, setTrends] = useState<Map<string, Trend>>(new Map());
  const [bodyweightVersion, setBodyweightVersion] = useState(0);
  // The week being logged; null hides the dialog. Bumping the key remounts it with fresh text.
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const [dialogKey, setDialogKey] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([
      createWorkoutRepository(db).loggedExercises(),
      createBodyweightRepository(db).list(),
      createWorkoutRepository(db).listFinished(),
    ]).then(([e, b, w]) => {
      if (!active) return;
      setExercises(e);
      setBodyweights(b);
      setOverview(summarizeOverview(w, b, 0, Date.now()));
      setTrends(trendsOf(w));
    });
    return () => {
      active = false;
    };
  }, [db, reloadToken, bodyweightVersion]);

  async function changeBodyweight(change: (week: string) => Promise<unknown>) {
    if (!editingWeek) return;
    try {
      await change(editingWeek);
      setEditingWeek(null);
      setBodyweightVersion((v) => v + 1);
      onChanged?.();
    } catch {
      await dialog({ title: t('common.saveFailed'), confirmLabel: t('common.ok') });
    }
  }

  const latest = bodyweights[bodyweights.length - 1];
  const previous = bodyweights[bodyweights.length - 2];
  const weight = (kg: number) => `${formatNumber(toDisplayWeight(kg, unit), 1)} ${unit}`;
  const thisWeek = weekStartKey(new Date());
  // Latest change in the card's chart metric: kg (or lb) for weighted lifts, reps otherwise.
  const changeText = (trend: Trend | undefined) => {
    if (!trend || trend.values.length < 2) return null;
    const diff = trend.values.at(-1)! - trend.values.at(-2)!;
    return trend.metric === 'reps'
      ? signed(t('common.repCount', { count: diff }), diff)
      : signed(weight(diff), diff);
  };

  return (
    <View style={{ gap: 8 }}>
      <Card accessibilityLabel={t('stats.overview')} onPress={() => onOpen({ kind: 'overview' })}>
        <AppText variant="heading">{t('stats.overview')}</AppText>
        <AppText variant="muted">
          {!overview || overview.workouts === 0
            ? t('stats.overviewHint')
            : overview.avgCalories === null
              ? t('stats.overviewCount', { count: overview.workouts })
              : t('stats.overviewSummary', {
                  count: overview.workouts,
                  kcal: Math.round(overview.avgCalories),
                })}
        </AppText>
      </Card>
      <Card
        accessibilityLabel={t('stats.bodyweight')}
        onPress={() => onOpen({ kind: 'bodyweight' })}
      >
        <TrendRow
          title={
            <>
              <AppText variant="heading">{t('stats.bodyweight')}</AppText>
              <AppText variant="muted">
                {latest ? weight(latest.weightKg) : t('stats.noBodyweight')}
              </AppText>
            </>
          }
          values={bodyweights.map((b) => b.weightKg)}
          change={
            latest && previous
              ? signed(
                  weight(latest.weightKg - previous.weightKg),
                  latest.weightKg - previous.weightKg,
                )
              : null
          }
        />
        <View style={{ alignItems: 'flex-start', marginLeft: -12 }}>
          <LinkButton
            label={t('stats.logBodyweight')}
            onPress={() => {
              setDialogKey((k) => k + 1);
              setEditingWeek(thisWeek);
            }}
          />
        </View>
      </Card>

      <AppText variant="label" style={{ marginTop: 8 }}>
        {t('stats.exercises').toUpperCase()}
      </AppText>
      {exercises.length === 0 ? (
        <AppText variant="muted">{t('stats.noExercises')}</AppText>
      ) : (
        exercises.map((e) => (
          <Card
            key={e.exerciseId}
            accessibilityLabel={e.name}
            onPress={() => onOpen({ kind: 'exercise', exerciseId: e.exerciseId, name: e.name })}
          >
            <TrendRow
              title={
                <>
                  <AppText variant="heading">{e.name}</AppText>
                  <AppText variant="muted">
                    {t('stats.sessionsLast', {
                      count: e.sessions,
                      date: formatShortDate(new Date(e.lastAt), i18n.language),
                    })}
                  </AppText>
                </>
              }
              values={trends.get(e.exerciseId)?.values ?? []}
              change={changeText(trends.get(e.exerciseId))}
            />
          </Card>
        ))
      )}
      <BodyweightDialog
        key={dialogKey}
        weekStart={editingWeek}
        currentKg={
          editingWeek
            ? (bodyweights.find((b) => b.weekStart === editingWeek)?.weightKg ?? null)
            : null
        }
        unit={unit}
        onSave={(value) =>
          void changeBodyweight((week) =>
            createBodyweightRepository(db).set(week, fromDisplayWeight(value, unit)),
          )
        }
        onRemove={() =>
          void changeBodyweight((week) => createBodyweightRepository(db).remove(week))
        }
        onCancel={() => setEditingWeek(null)}
      />
    </View>
  );
}
