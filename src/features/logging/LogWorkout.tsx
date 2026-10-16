import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb, type Db } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { useTheme } from '@/core/theme';
import { createWorkoutRepository, type LoggedSet, type Workout } from '@/data';
import { AppText, Button, useDialog } from '@/ui';

import { ExerciseLogCard } from './ExerciseLogCard';

interface Props {
  workoutId: string;
  /** Changes when exercises were added elsewhere, to reload. */
  reloadToken?: number;
  onAddExercises(): void;
  onFinished(result: 'saved' | 'discarded'): void;
}

async function loadWorkout(db: Db, workoutId: string) {
  const repo = createWorkoutRepository(db);
  const workout = await repo.get(workoutId);
  const entries = await Promise.all(
    (workout?.exercises ?? []).map(
      async (e) => [e.exerciseId, await repo.previousSets(e.exerciseId, workoutId)] as const,
    ),
  );
  return { workout, previous: Object.fromEntries(entries) as Record<string, LoggedSet[]> };
}

/** The mid-workout screen: big targets, pre-filled numbers, works offline, screen stays on. */
export function LogWorkout({ workoutId, reloadToken, onAddExercises, onFinished }: Props) {
  useKeepAwake();
  const { t } = useTranslation();
  const theme = useTheme();
  const dialog = useDialog();
  const db = useDb();
  const { settings } = useSettings();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [previous, setPrevious] = useState<Record<string, LoggedSet[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void loadWorkout(db, workoutId).then((data) => {
      if (!active) return;
      setWorkout(data.workout);
      setPrevious(data.previous);
      setExpandedId(
        (current) =>
          current ??
          data.workout?.exercises.find((e) => e.sets.length === 0)?.id ??
          data.workout?.exercises[0]?.id ??
          null,
      );
    });
    return () => {
      active = false;
    };
  }, [db, workoutId, reloadToken, version]);

  const repo = createWorkoutRepository(db);
  const run = (action: Promise<unknown>) =>
    void action
      .then(() => setVersion((v) => v + 1))
      .catch(() => dialog({ title: t('common.saveFailed'), confirmLabel: t('common.ok') }));

  async function finish() {
    const ok = await dialog({
      title: t('logging.finishTitle'),
      message: t('logging.finishBody'),
      confirmLabel: t('logging.finish'),
      cancelLabel: t('common.cancel'),
    });
    if (ok) onFinished(await repo.finish(workoutId));
  }

  if (!workout) return null;

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {workout.exercises.map((exercise) => (
            <ExerciseLogCard
              key={exercise.id}
              exercise={exercise}
              previousSets={previous[exercise.exerciseId] ?? []}
              unit={settings.weightUnit}
              rpeEnabled={settings.rpeEnabled}
              expanded={expandedId === exercise.id}
              onToggle={() => setExpandedId((id) => (id === exercise.id ? null : exercise.id))}
              onAddSet={(input) => run(repo.addSet(exercise.id, input))}
              onUpdateSet={(setId, input) => run(repo.updateSet(setId, input))}
              onDeleteSet={(setId) => run(repo.deleteSet(setId))}
            />
          ))}
          {workout.exercises.length === 0 ? (
            <AppText variant="muted">{t('logging.noExercises')}</AppText>
          ) : null}
          <Button label={t('logging.addExercise')} variant="secondary" onPress={onAddExercises} />
        </ScrollView>
        <View
          style={{
            padding: 16,
            borderTopWidth: 1,
            borderTopColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          }}
        >
          <Button label={t('logging.finish')} onPress={() => void finish()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
