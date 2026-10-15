import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { formatLongDate } from '@/core/dates';
import { useTranslation } from '@/core/i18n';
import { RoutineList } from '@/features/templates';
import { AppText, Button, Screen } from '@/ui';

import type { RootStackParamList } from './navigation';

export function HomeScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Home'>) {
  const { t, i18n } = useTranslation();
  const [focusCount, setFocusCount] = useState(0);
  const [today, setToday] = useState(() => new Date());

  useFocusEffect(
    useCallback(() => {
      setFocusCount((n) => n + 1);
      setToday(new Date());
    }, []),
  );

  return (
    <Screen>
      <View style={{ gap: 4, marginTop: 24 }}>
        <AppText variant="muted">{formatLongDate(today, i18n.language)}</AppText>
        <AppText variant="title">{t('app.name')}</AppText>
      </View>

      <Button
        label={t('home.newWorkout')}
        onPress={() => navigation.navigate('PickExercises', {})}
      />

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
