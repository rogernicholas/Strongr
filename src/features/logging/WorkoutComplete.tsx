import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { weekStartKey } from '@/core/dates';
import { useDb, type Db } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { fonts, useTheme } from '@/core/theme';
import { bodyweightFor } from '@/core/training';
import { formatNumber } from '@/core/units';
import {
  createBodyweightRepository,
  createWorkoutRepository,
  type LoggedSet,
  type Workout,
} from '@/data';
import { AppText, Button, Card } from '@/ui';

import { suggestWeightIncreases, type WeightSuggestion } from './weightSuggestions';
import {
  exerciseProgression,
  PHRASES,
  phraseIndex,
  summarizeWorkout,
  type ExerciseProgression,
  type WorkoutSummary,
} from './workoutSummary';

interface Props {
  workoutId: string;
  onDone(): void;
}

interface State {
  phrase: number;
  summary: WorkoutSummary;
  progression: ExerciseProgression[];
  suggestions: WeightSuggestion[];
}

/** Each exercise's sets from its session before this workout. */
async function previousSessions(db: Db, w: Workout): Promise<Record<string, LoggedSet[]>> {
  const repo = createWorkoutRepository(db);
  const entries = await Promise.all(
    w.exercises.map(async (e) => [e.exerciseId, await repo.previousSets(e.exerciseId, w.id)]),
  );
  return Object.fromEntries(entries);
}

/** "Good job" screen shown after a workout is saved. */
export function WorkoutComplete({ workoutId, onDone }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const { settings } = useSettings();
  const [state, setState] = useState<State | null>(null);
  const { weightSuggestions, suggestAtReps, weightUnit } = settings;

  useEffect(() => {
    let active = true;
    const repo = createWorkoutRepository(db);
    void (async () => {
      const [workout, count, bodyweights] = await Promise.all([
        repo.get(workoutId),
        repo.countFinished(),
        createBodyweightRepository(db).list(),
      ]);
      if (!workout) return;
      const previous = await previousSessions(db, workout);
      if (!active) return;
      const kg = bodyweightFor(bodyweights, weekStartKey(new Date(workout.startedAt)));
      setState({
        phrase: phraseIndex(count),
        summary: summarizeWorkout(workout, kg),
        progression: exerciseProgression(workout, previous),
        suggestions: weightSuggestions
          ? suggestWeightIncreases(workout, suggestAtReps, weightUnit)
          : [],
      });
    })();
    return () => {
      active = false;
    };
  }, [db, workoutId, weightSuggestions, suggestAtReps, weightUnit]);

  const stat = (value: string, label: string) => (
    <View style={{ width: '48.5%' }}>
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

  const changeText = (p: ExerciseProgression) => {
    if (p.first) return t('done.firstSession');
    if (p.change === null) return '–';
    const pct = formatNumber(p.change * 100, 1);
    return t('done.change', { change: p.change > 0 ? `+${pct}` : pct });
  };

  const section = (title: string, lines: { key: string; left: string; right?: string }[]) => (
    <View style={{ gap: 4 }}>
      <AppText variant="label" style={{ textAlign: 'center' }}>
        {title.toUpperCase()}
      </AppText>
      {lines.map((line) =>
        line.right === undefined ? (
          <AppText key={line.key} variant="muted" style={{ textAlign: 'center' }}>
            {line.left}
          </AppText>
        ) : (
          <View key={line.key} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="muted" style={{ flex: 1 }}>
              {line.left}
            </AppText>
            <AppText variant="muted">{line.right}</AppText>
          </View>
        ),
      )}
    </View>
  );

  return (
    <SafeAreaView
      style={{ flex: 1, padding: theme.spacing(4), backgroundColor: theme.colors.background }}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: theme.spacing(8) }}
      >
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
            <View style={{ gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  rowGap: 8,
                }}
              >
                {stat(
                  t('done.minutes', {
                    count: Math.max(1, Math.round(state.summary.durationMs / 60_000)),
                  }),
                  t('done.duration'),
                )}
                {stat(
                  state.summary.calories === null
                    ? '–'
                    : t('done.kcal', { value: Math.round(state.summary.calories) }),
                  t('done.calories'),
                )}
                {stat(String(state.summary.exercises), t('done.exercises'))}
                {stat(String(state.summary.workingSets), t('done.sets'))}
              </View>
              {state.summary.calories === null ? (
                <AppText variant="muted" style={{ textAlign: 'center' }}>
                  {t('done.caloriesNeedBodyweight')}
                </AppText>
              ) : null}
            </View>
            {state.progression.length > 0
              ? section(
                  t('done.progress'),
                  state.progression.map((p, i) => ({
                    key: String(i),
                    left: p.name,
                    right: changeText(p),
                  })),
                )
              : null}
            {state.suggestions.length > 0
              ? section(
                  t('done.readyForMore'),
                  state.suggestions.map((s, i) => ({
                    key: String(i),
                    left: t('done.suggestion', { name: s.exerciseName, weight: s.next }),
                  })),
                )
              : null}
          </>
        ) : null}
      </ScrollView>
      <Button label={t('done.button')} onPress={onDone} />
    </SafeAreaView>
  );
}
