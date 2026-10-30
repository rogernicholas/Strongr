import type { NavigationProp } from '@react-navigation/native';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { calendarDaysBetween, formatLongDate } from '@/core/dates';
import { useDb, type Db } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import {
  createExerciseRepository,
  createRoutineRepository,
  createWorkoutRepository,
  type Routine,
} from '@/data';
import { nextRoutine } from '@/features/templates';
import { AppText, Button, Card, LinkButton } from '@/ui';

import type { RootStackParamList } from './navigation';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
  /** Changes whenever the main screen regains focus. */
  reloadToken: number;
}

interface HomeData {
  activeWorkoutId: string | null;
  lastTrainedAt: number | null;
  next: Routine | null;
  /** Names of the next routine's exercises, in order. */
  nextExercises: string[];
}

async function loadHome(db: Db): Promise<HomeData> {
  const workouts = createWorkoutRepository(db);
  const [activeWorkoutId, latest, routines, exercises] = await Promise.all([
    workouts.findActive(),
    workouts.latestFinished(),
    createRoutineRepository(db).list(),
    createExerciseRepository(db).list(),
  ]);
  const next = nextRoutine(routines, latest?.templateId ?? null);
  const names = new Map(exercises.map((e) => [e.id, e.name]));
  return {
    activeWorkoutId,
    lastTrainedAt: latest?.startedAt ?? null,
    next,
    nextExercises: next?.exerciseIds.flatMap((id) => names.get(id) ?? []) ?? [],
  };
}

/** First page of the main pager: what's next, when you last trained, and one start button. */
export function HomePage({ navigation, reloadToken }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const [home, setHome] = useState<HomeData | null>(null);
  // A quick double tap must not start two workouts.
  const starting = useRef(false);
  const today = new Date();

  useEffect(() => {
    let active = true;
    void loadHome(db).then((data) => active && setHome(data));
    return () => {
      active = false;
    };
  }, [db, reloadToken]);

  async function startNext(routine: Routine) {
    if (starting.current) return;
    starting.current = true;
    try {
      const workoutId = await createWorkoutRepository(db).start({
        exerciseIds: routine.exerciseIds,
        templateId: routine.id,
        name: routine.name,
      });
      navigation.navigate('LogWorkout', { workoutId, title: routine.name });
    } finally {
      starting.current = false;
    }
  }

  const lastAt = home?.lastTrainedAt ?? null;
  const days = lastAt === null ? null : calendarDaysBetween(new Date(lastAt), today);
  const lastTrained =
    days === null
      ? null
      : days === 0
        ? t('home.lastTrainedToday')
        : days === 1
          ? t('home.lastTrainedYesterday')
          : t('home.lastTrainedDays', { count: days });
  const activeWorkoutId = home?.activeWorkoutId ?? null;
  const next = activeWorkoutId || !home?.next?.exerciseIds.length ? null : home.next;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, padding: theme.spacing(4), backgroundColor: theme.colors.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing(6) }}>
        <View style={{ alignItems: 'center' }}>
          <AppText variant="logo">
            {t('app.name')}
            <Text style={{ color: theme.colors.primary }}>.</Text>
          </AppText>
          <AppText variant="muted">{formatLongDate(today, i18n.language)}</AppText>
          {lastTrained ? <AppText variant="muted">{lastTrained}</AppText> : null}
        </View>

        {/* Nothing until loaded, so a wrong button never flashes up under a thumb. */}
        <View
          pointerEvents={home ? 'auto' : 'none'}
          style={{ gap: theme.spacing(3), opacity: home ? 1 : 0 }}
        >
          {activeWorkoutId ? (
            <Card
              accessibilityLabel={t('home.resume')}
              onPress={() => navigation.navigate('LogWorkout', { workoutId: activeWorkoutId })}
            >
              <AppText variant="heading">{t('home.resume')}</AppText>
              <AppText variant="muted">{t('home.resumeHint')}</AppText>
            </Card>
          ) : next ? (
            <>
              <Card>
                <AppText variant="label">{t('home.nextUp').toUpperCase()}</AppText>
                <AppText variant="title" style={{ color: theme.colors.accent }}>
                  {next.name}
                </AppText>
                <AppText variant="muted" numberOfLines={2}>
                  {home?.nextExercises.join(' · ')}
                </AppText>
              </Card>
              <Button
                label={t('home.start', { name: next.name })}
                onPress={() => void startNext(next)}
              />
            </>
          ) : (
            <Button
              label={t('home.newWorkout')}
              onPress={() => navigation.navigate('PickExercises', {})}
            />
          )}
          <View style={{ flexDirection: 'row', gap: theme.spacing(3) }}>
            {next ? (
              <View style={{ flex: 1 }}>
                <Button
                  label={t('home.newWorkout')}
                  variant="secondary"
                  onPress={() => navigation.navigate('PickExercises', {})}
                />
              </View>
            ) : null}
            <View style={{ flex: 1 }}>
              <Button
                label={t('home.myRoutines')}
                variant="secondary"
                onPress={() => navigation.navigate('Routines')}
              />
            </View>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <LinkButton label={t('home.settings')} onPress={() => navigation.navigate('Settings')} />
        <LinkButton label={t('home.about')} onPress={() => navigation.navigate('About')} />
      </View>
    </SafeAreaView>
  );
}
