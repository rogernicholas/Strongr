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

import type { StatsTarget } from './types';

interface Props {
  onOpen(target: StatsTarget): void;
  /** Change this to reload, e.g. when the screen regains focus. */
  reloadToken?: number;
}

/** Bodyweight first, then every exercise that has been logged. */
export function StatsList({ onOpen, reloadToken }: Props) {
  const { t, i18n } = useTranslation();
  const db = useDb();
  const { settings } = useSettings();
  const unit = settings.weightUnit;
  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [bodyweights, setBodyweights] = useState<Bodyweight[]>([]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      createWorkoutRepository(db).loggedExercises(),
      createBodyweightRepository(db).list(),
    ]).then(([e, b]) => {
      if (!active) return;
      setExercises(e);
      setBodyweights(b);
    });
    return () => {
      active = false;
    };
  }, [db, reloadToken]);

  const latest = bodyweights[bodyweights.length - 1];

  return (
    <View style={{ gap: 8 }}>
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
