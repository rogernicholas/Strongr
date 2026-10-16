import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
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

type Previous = Record<string, LoggedSet[]>;

/**
 * Loads the workout plus last session's sets. Previous sessions can't change mid-workout,
 * so only exercises not in `known` are looked up (saves queries on every set change).
 */
async function loadWorkout(db: Db, workoutId: string, known: Previous) {
  const repo = createWorkoutRepository(db);
  const workout = await repo.get(workoutId);
  const missing = (workout?.exercises ?? []).filter((e) => !(e.exerciseId in known));
  const entries = await Promise.all(
    missing.map(
      async (e) => [e.exerciseId, await repo.previousSets(e.exerciseId, workoutId)] as const,
    ),
  );
  return { workout, previous: { ...known, ...Object.fromEntries(entries) } as Previous };
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
  const [previous, setPrevious] = useState<Previous>({});
  const previousRef = useRef<Previous>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    void loadWorkout(db, workoutId, previousRef.current).then((data) => {
      if (!active) return;
      setWorkout(data.workout);
      previousRef.current = data.previous;
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
    if (!ok) return;
    try {
      onFinished(await repo.finish(workoutId));
    } catch {
      await dialog({ title: t('common.saveFailed'), confirmLabel: t('common.ok') });
    }
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
