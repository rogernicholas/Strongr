import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { formatLongDate } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createWorkoutRepository } from '@/data';
import { ExportButton } from '@/features/backup';
import { WeeklyBodyweight } from '@/features/progress';
import { RoutineList } from '@/features/templates';
import { AppText, Button, Card, Screen } from '@/ui';

import type { RootStackParamList } from './navigation';

export function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { t, i18n } = useTranslation();
  const [focusCount, setFocusCount] = useState(0);
  const [today, setToday] = useState(() => new Date());
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const db = useDb();

  useFocusEffect(
    useCallback(() => {
      setFocusCount((n) => n + 1);
      setToday(new Date());
      void createWorkoutRepository(db).findActive().then(setActiveWorkoutId);
    }, [db]),
  );

  return (
    <Screen>
      <View style={{ gap: 4, marginTop: 24 }}>
        <AppText variant="muted">{formatLongDate(today, i18n.language)}</AppText>
        <AppText variant="logo">{t('app.logo')}</AppText>
      </View>

      {activeWorkoutId ? (
        <Card
          accessibilityLabel={t('home.resume')}
          onPress={() => navigation.navigate('LogWorkout', { workoutId: activeWorkoutId })}
        >
          <AppText style={{ fontSize: 18, fontWeight: '600' }}>{t('home.resume')}</AppText>
          <AppText variant="muted">{t('home.resumeHint')}</AppText>
        </Card>
      ) : (
        <Button
          label={t('home.newWorkout')}
          onPress={() => navigation.navigate('PickExercises', {})}
        />
      )}

      <AppText variant="label" style={{ marginTop: 8 }}>
        {t('home.routines').toUpperCase()}
      </AppText>
      <RoutineList
        reloadToken={focusCount}
        onSelect={(routine) =>
          navigation.navigate('PickExercises', {
            routineId: routine.id,
            routineName: routine.name,
            exerciseIds: routine.exerciseIds,
          })
        }
      />

      <Button
        label={t('home.history')}
        variant="secondary"
        onPress={() => navigation.navigate('Calendar')}
      />
      <WeeklyBodyweight key={`bw-${focusCount}`} />
      <ExportButton />

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
        <View style={{ flex: 1 }}>
          <Button
            label={t('home.settings')}
            variant="secondary"
            onPress={() => navigation.navigate('Settings')}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('home.about')}
            variant="secondary"
            onPress={() => navigation.navigate('About')}
          />
        </View>
      </View>
    </Screen>
  );
}
