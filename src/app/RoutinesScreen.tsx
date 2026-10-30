import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';

import { RoutineList } from '@/features/templates';
import { useTranslation } from '@/core/i18n';
import { Button, Screen } from '@/ui';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Routines'>;

/** "My routines": make a new routine, or tap a saved one to edit or start it. */
export function RoutinesScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [focusCount, setFocusCount] = useState(0);
  useFocusEffect(useCallback(() => setFocusCount((n) => n + 1), []));

  return (
    <Screen>
      <Button
        label={t('routines.new')}
        variant="secondary"
        onPress={() => navigation.navigate('PickExercises', { newRoutine: true })}
      />
      <RoutineList
        reloadToken={focusCount}
        onSelect={(routine) =>
          navigation.navigate('PickExercises', {
            routineId: routine.id,
            routineName: routine.name,
            exerciseIds: routine.exerciseIds,
            editRoutine: true,
          })
        }
      />
    </Screen>
  );
}
