import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { formatShortDate } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { formatNumber, toDisplayWeight } from '@/core/units';
import {
  createBodyweightRepository,
  createWorkoutRepository,
  type Bodyweight,
  type LoggedExercise,
} from '@/data';
import { AppText, Card } from '@/ui';

import { summarizeOverview, type Overview } from './overview';
import type { StatsTarget } from './types';

interface Props {
  onOpen(target: StatsTarget): void;
  /** Change this to reload, e.g. when the screen regains focus. */
  reloadToken?: number;
}

/** Overview and bodyweight first, then every exercise that has been logged. */
export function StatsList({ onOpen, reloadToken }: Props) {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [bodyweights, setBodyweights] = useState<Bodyweight[]>([]);
  const [overview, setOverview] = useState<Overview | null>(null);

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
    });
    return () => {
      active = false;
    };
  }, [db, reloadToken]);

  const latest = bodyweights[bodyweights.length - 1];

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
        <AppText variant="heading">{t('stats.bodyweight')}</AppText>
        <AppText variant="muted">
          {latest
            ? `${formatNumber(toDisplayWeight(latest.weightKg, unit), 1)} ${unit}`
            : t('stats.noBodyweight')}
        </AppText>
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
            <AppText variant="heading">{e.name}</AppText>
            <AppText variant="muted">
              {t('stats.sessionsLast', {
                count: e.sessions,
                date: formatShortDate(new Date(e.lastAt), i18n.language),
              })}
            </AppText>
          </Card>
        ))
      )}
    </View>
  );
}
