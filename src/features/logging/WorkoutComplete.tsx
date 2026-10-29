import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { fonts, useTheme } from '@/core/theme';
import { createWorkoutRepository } from '@/data';
import { AppText, Button, Card } from '@/ui';

import { suggestWeightIncreases, type WeightSuggestion } from './weightSuggestions';
import { PHRASES, phraseIndex, summarizeWorkout, type WorkoutSummary } from './workoutSummary';

interface Props {
  workoutId: string;
  onDone(): void;
}

/** "Good job" screen shown after a workout is saved. */
export function WorkoutComplete({ workoutId, onDone }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const { settings } = useSettings();
  const [state, setState] = useState<{
    phrase: number;
    summary: WorkoutSummary;
    suggestions: WeightSuggestion[];
  } | null>(null);
  const { weightSuggestions, suggestAtReps, weightUnit } = settings;

  useEffect(() => {
    let active = true;
    const repo = createWorkoutRepository(db);
    void Promise.all([repo.get(workoutId), repo.countFinished()]).then(([workout, count]) => {
      if (!active || !workout) return;
      setState({
        phrase: phraseIndex(count),
        summary: summarizeWorkout(workout),
        suggestions: weightSuggestions
          ? suggestWeightIncreases(workout, suggestAtReps, weightUnit)
          : [],
      });
    });
    return () => {
      active = false;
    };
  }, [db, workoutId, weightSuggestions, suggestAtReps, weightUnit]);

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
            {state.suggestions.length > 0 ? (
              <View style={{ gap: 4 }}>
                <AppText variant="label" style={{ textAlign: 'center' }}>
                  {t('done.readyForMore').toUpperCase()}
                </AppText>
                {state.suggestions.map((s, i) => (
                  <AppText key={i} variant="muted" style={{ textAlign: 'center' }}>
                    {t('done.suggestion', { name: s.exerciseName, weight: s.next })}
                  </AppText>
                ))}
              </View>
            ) : null}
          </>
        ) : null}
      </View>
      <Button label={t('done.button')} onPress={onDone} />
    </SafeAreaView>
  );
}
