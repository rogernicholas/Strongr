import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, LayoutAnimation, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb, type Db } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { useTheme } from '@/core/theme';
import {
  createWorkoutRepository,
  type LoggedSet,
  type Workout,
  type WorkoutExercise,
} from '@/data';
import { AppText, Button, useDialog } from '@/ui';

import { ExerciseLogCard } from './ExerciseLogCard';

interface Props {
  workoutId: string;
  /** Changes when exercises were added elsewhere, to reload. */
  reloadToken?: number;
  onAddExercises(): void;
  /** `cancelled`: the user threw the workout away, sets and all. */
  onFinished(result: 'saved' | 'discarded' | 'cancelled'): void;
}

type Previous = Record<string, LoggedSet[]>;

/** Cards slide and fade when exercises are added or removed. */
const listAnimation = LayoutAnimation.create(
  220,
  LayoutAnimation.Types.easeInEaseOut,
  LayoutAnimation.Properties.opacity,
);

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
  // Card ids from the last load, to spot exercises that were just added or removed.
  const shownIds = useRef<string[] | null>(null);

  useEffect(() => {
    let active = true;
    void loadWorkout(db, workoutId, previousRef.current).then((data) => {
      if (!active) return;
      const exercises = data.workout?.exercises ?? [];
      const before = shownIds.current;
      const ids = exercises.map((e) => e.id);
      const added = before ? ids.filter((id) => !before.includes(id)) : [];
      if (before && (added.length > 0 || ids.length !== before.length)) {
        LayoutAnimation.configureNext(listAnimation);
      }
      shownIds.current = ids;
      setWorkout(data.workout);
      previousRef.current = data.previous;
      setPrevious(data.previous);
      setExpandedId((current) => {
        if (added[0]) return added[0];
        if (current && ids.includes(current)) return current;
        return exercises.find((e) => e.sets.length === 0)?.id ?? ids[0] ?? null;
      });
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

  async function removeExercise(exercise: WorkoutExercise) {
    if (exercise.sets.length > 0) {
      const ok = await dialog({
        title: t('logging.removeTitle', { name: exercise.exerciseName }),
        message: t('logging.removeBody', { count: exercise.sets.length }),
        confirmLabel: t('logging.remove'),
        cancelLabel: t('common.cancel'),
        destructive: true,
      });
      if (!ok) return;
    }
    run(repo.removeExercise(exercise.id));
  }

  async function cancel() {
    const sets = workout?.exercises.reduce((n, e) => n + e.sets.length, 0) ?? 0;
    const ok = await dialog({
      title: t('logging.cancelTitle'),
      message: t('logging.cancelBody', { count: sets }),
      confirmLabel: t('logging.cancelConfirm'),
      cancelLabel: t('logging.keepGoing'),
      destructive: true,
    });
    if (!ok) return;
    try {
      await repo.remove(workoutId);
      onFinished('cancelled');
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
              onRemove={() => void removeExercise(exercise)}
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
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button
              label={t('logging.cancelWorkout')}
              variant="quiet"
              onPress={() => void cancel()}
            />
            <View style={{ flex: 1 }}>
              <Button label={t('logging.finish')} onPress={() => void finish()} />
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
