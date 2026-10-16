import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { WorkoutComplete } from '@/features/logging';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkoutDone'>;

export function WorkoutDoneScreen({ route, navigation }: Props) {
  return (
    <WorkoutComplete workoutId={route.params.workoutId} onDone={() => navigation.popToTop()} />
  );
}
