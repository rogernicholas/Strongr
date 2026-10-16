import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { StatsDetail } from '@/features/progress';

import type { RootStackParamList } from './navigation';

export function StatsDetailScreen({
  route,
}: NativeStackScreenProps<RootStackParamList, 'StatsDetail'>) {
  return <StatsDetail target={route.params.target} />;
}
