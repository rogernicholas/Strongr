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
import { RestTimer } from './RestTimer';

interface Props {
  workoutId: string;
  /** `edit`: a finished workout opened from the calendar. Changes save as you go; Done leaves. */
  mode?: 'live' | 'edit';
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

const FADE_STEPS = [0.15, 0.35, 0.6, 0.85];

/** Cards scrolling under the bottom bar fade out instead of being cut mid-line. */
function Fade({ color }: { color: string }) {
  return (
    <View pointerEvents="none" style={{ position: 'absolute', top: -24, left: 0, right: 0 }}>
      {FADE_STEPS.map((opacity) => (
        <View key={opacity} style={{ height: 6, backgroundColor: color, opacity }} />
      ))}
    </View>
  );
}

function KeepAwake() {
  useKeepAwake();
  return null;
}

/**
 * The mid-workout screen: big targets, pre-filled numbers, works offline, screen stays on.
 * The same cards edit a finished workout.
 */
export function LogWorkout(props: Props) {
  const { workoutId, mode = 'live', reloadToken, onAddExercises, onFinished } = props;
  const live = mode === 'live';
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
        if (!live) return null;
        return exercises.find((e) => e.sets.length === 0)?.id ?? ids[0] ?? null;
      });
    });
    return () => {
      active = false;
    };
  }, [db, workoutId, live, reloadToken, version]);

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

  // The rest timer runs from the most recently logged set until its rest is logged.
  const last = workout.exercises
    .flatMap((e) => e.sets.map((set) => ({ set, exerciseId: e.id })))
    .reduce<{ set: LoggedSet; exerciseId: string } | null>(
      (latest, entry) =>
        entry.set.completedAt !== null &&
        (latest === null || entry.set.completedAt > latest.set.completedAt!)
          ? entry
          : latest,
      null,
    );
  const resting = live && settings.showRestTimer && last !== null && last.set.restS === null;

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      {live ? <KeepAwake /> : null}
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
          keyboardShouldPersistTaps="handled"
        >
          {workout.exercises.map((exercise, i) => (
            <ExerciseLogCard
              key={exercise.id}
              exercise={exercise}
              position={i + 1}
              total={workout.exercises.length}
              previousSets={previous[exercise.exerciseId] ?? []}
              unit={settings.weightUnit}
              rpeEnabled={settings.rpeEnabled}
              expanded={expandedId === exercise.id}
              onToggle={() => setExpandedId((id) => (id === exercise.id ? null : exercise.id))}
              onAddSet={(input) => run(repo.addSet(exercise.id, input, live))}
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
          style={{ padding: 16, paddingTop: 8, gap: 8, backgroundColor: theme.colors.background }}
        >
          <Fade color={theme.colors.background} />
          {resting ? (
            <RestTimer
              key={last.set.id}
              since={last.set.completedAt!}
              changeover={expandedId !== null && expandedId !== last.exerciseId}
              onLog={(seconds) => run(repo.logRest(last.set.id, seconds))}
            />
          ) : null}
          {live ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button
                label={t('logging.cancelWorkout')}
                variant="quiet"
                onPress={() => void cancel()}
              />
              <View style={{ flex: 1 }}>
                <Button
                  label={t('logging.finish')}
                  variant="secondary"
                  onPress={() => void finish()}
                />
              </View>
            </View>
          ) : (
            <Button
              label={t('logging.done')}
              variant="secondary"
              onPress={() => onFinished('saved')}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
