import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { AboutScreen, SettingsScreen } from '@/features/settings';

import { HomeScreen } from './HomeScreen';
import { LogWorkoutScreen } from './LogWorkoutScreen';
import { PickExercisesScreen } from './PickExercisesScreen';

export type RootStackParamList = {
  Home: undefined;
  PickExercises: {
    routineId?: string;
    routineName?: string;
    exerciseIds?: string[];
    /** Picking exercises to add to a workout in progress. */
    addToWorkoutId?: string;
  };
  LogWorkout: { workoutId: string; title?: string };
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
          card: theme.colors.surface,
          text: theme.colors.text,
          border: theme.colors.border,
          primary: theme.colors.primary,
        },
      }}
    >
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
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
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('settings.title') }}
        />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: t('about.title') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
