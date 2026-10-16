import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import type { StatsTarget } from '@/features/progress';
import { AboutScreen, SettingsScreen } from '@/features/settings';

import { LogWorkoutScreen } from './LogWorkoutScreen';
import { MainScreen } from './MainScreen';
import { PickExercisesScreen } from './PickExercisesScreen';
import { RoutinesScreen } from './RoutinesScreen';
import { StatsDetailScreen } from './StatsDetailScreen';
import { WorkoutDoneScreen } from './WorkoutDoneScreen';

export type RootStackParamList = {
  /** Pager with Home, Calendar and Stats. */
  Main: undefined;
  PickExercises: {
    routineId?: string;
    routineName?: string;
    exerciseIds?: string[];
    /** Picking exercises to add to a workout in progress. */
    addToWorkoutId?: string;
  };
  LogWorkout: { workoutId: string; title?: string };
  /** "Good job" summary after a saved workout. */
  WorkoutDone: { workoutId: string };
  Routines: undefined;
  StatsDetail: { target: StatsTarget };
  Settings: undefined;
  About: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigation() {
  const theme = useTheme();
  const { t } = useTranslation();
  const base = theme.dark ? DarkTheme : DefaultTheme;

  return (
    <NavigationContainer
      theme={{
        ...base,
        colors: {
          ...base.colors,
          background: theme.colors.background,
          card: theme.colors.background,
          text: theme.colors.text,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          contentStyle: { backgroundColor: theme.colors.background },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="Main" component={MainScreen} options={{ headerShown: false }} />
        <Stack.Screen
          name="PickExercises"
          component={PickExercisesScreen}
          options={({ route }) => ({
            title: route.params.addToWorkoutId
              ? t('logging.addExercise')
              : (route.params.routineName ?? t('exercises.title')),
          })}
        />
        <Stack.Screen
          name="LogWorkout"
          component={LogWorkoutScreen}
          options={({ route }) => ({ title: route.params.title ?? t('logging.title') })}
        />
        <Stack.Screen
          name="WorkoutDone"
          component={WorkoutDoneScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Routines"
          component={RoutinesScreen}
          options={{ title: t('routines.title') }}
        />
        <Stack.Screen
          name="StatsDetail"
          component={StatsDetailScreen}
          options={({ route }) => ({
            title:
              route.params.target.kind === 'exercise'
                ? route.params.target.name
                : t('stats.bodyweight'),
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('settings.title') }}
        />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: t('about.title') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
