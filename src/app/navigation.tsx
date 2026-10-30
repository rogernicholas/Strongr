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
    /** Building a new routine from My routines: save it, no workout. */
    newRoutine?: boolean;
    /** Opened from My routines: rename the routine or change its exercises, or start it. */
    editRoutine?: boolean;
  };
  /** `edit` opens a finished workout from the calendar. */
  LogWorkout: { workoutId: string; title?: string; mode?: 'live' | 'edit' };
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
          options={({ route }) =>
            route.params.addToWorkoutId
              ? // Adding mid-workout slides up over the workout like a sheet.
                { title: t('logging.addExercise'), animation: 'slide_from_bottom' }
              : {
                  title: route.params.newRoutine
                    ? t('routines.newTitle')
                    : (route.params.routineName ?? t('exercises.title')),
                }
          }
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
                : t(
                    route.params.target.kind === 'overview' ? 'stats.overview' : 'stats.bodyweight',
                  ),
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
