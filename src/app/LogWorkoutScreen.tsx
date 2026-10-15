import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ToastAndroid } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { LogWorkout } from '@/features/logging';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'LogWorkout'>;

export function LogWorkoutScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const { workoutId } = route.params;
  const [focusCount, setFocusCount] = useState(0);

  // Reload after returning from "Add exercise".
  useFocusEffect(useCallback(() => setFocusCount((n) => n + 1), []));

  return (
    <LogWorkout
      workoutId={workoutId}
      reloadToken={focusCount}
      onAddExercises={() => navigation.navigate('PickExercises', { addToWorkoutId: workoutId })}
      onFinished={(result) => {
        ToastAndroid.show(
          t(result === 'saved' ? 'logging.saved' : 'logging.discarded'),
          ToastAndroid.SHORT,
        );
        navigation.popToTop();
      }}
    />
  );
}
