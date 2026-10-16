import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';

import { RoutineList } from '@/features/templates';
import { Screen } from '@/ui';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Routines'>;

/** "My routines": view saved routines, tap one to start from it. */
export function RoutinesScreen({ navigation }: Props) {
  const [focusCount, setFocusCount] = useState(0);
  useFocusEffect(useCallback(() => setFocusCount((n) => n + 1), []));

  return (
    <Screen>
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
    </Screen>
  );
}
