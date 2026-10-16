import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { fonts, useTheme } from '@/core/theme';
import { createWorkoutRepository } from '@/data';
import { AppText, Button, Card } from '@/ui';

import { phraseIndex, summarizeWorkout, type WorkoutSummary } from './workoutSummary';

const PHRASES = [
  'done.phrase1',
  'done.phrase2',
  'done.phrase3',
  'done.phrase4',
  'done.phrase5',
  'done.phrase6',
  'done.phrase7',
  'done.phrase8',
  'done.phrase9',
  'done.phrase10',
  'done.phrase11',
  'done.phrase12',
  'done.phrase13',
  'done.phrase14',
  'done.phrase15',
] as const;

interface Props {
  workoutId: string;
  onDone(): void;
}

/** "Good job" screen shown after a workout is saved. */
export function WorkoutComplete({ workoutId, onDone }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const [state, setState] = useState<{ phrase: number; summary: WorkoutSummary } | null>(null);

  useEffect(() => {
    let active = true;
    const repo = createWorkoutRepository(db);
    void Promise.all([repo.get(workoutId), repo.countFinished()]).then(([workout, count]) => {
      if (!active || !workout) return;
      setState({ phrase: phraseIndex(count), summary: summarizeWorkout(workout) });
    });
    return () => {
      active = false;
    };
  }, [db, workoutId]);

  const stat = (value: string, label: string) => (
    <View style={{ flex: 1 }}>
      <Card>
        <AppText variant="stat" style={{ textAlign: 'center' }}>
          {value}
        </AppText>
        <AppText variant="label" style={{ textAlign: 'center' }}>
          {label.toUpperCase()}
        </AppText>
      </Card>
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, padding: theme.spacing(4), backgroundColor: theme.colors.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing(8) }}>
        {state ? (
          <>
            <AppText
              accessibilityRole="header"
              style={{
                fontFamily: fonts.logo,
                fontSize: 44,
                lineHeight: 52,
                textAlign: 'center',
                color: theme.colors.accent,
              }}
            >
              {t(PHRASES[state.phrase]!)}
            </AppText>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {stat(
                t('done.minutes', {
                  count: Math.max(1, Math.round(state.summary.durationMs / 60_000)),
                }),
                t('done.duration'),
              )}
              {stat(String(state.summary.exercises), t('done.exercises'))}
              {stat(String(state.summary.workingSets), t('done.sets'))}
            </View>
          </>
        ) : null}
      </View>
      <Button label={t('done.button')} onPress={onDone} />
    </SafeAreaView>
  );
}
