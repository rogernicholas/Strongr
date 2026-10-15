import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { AboutScreen, SettingsScreen } from '@/features/settings';

import { HomeScreen } from './HomeScreen';

export type RootStackParamList = {
  Home: undefined;
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
          name="Settings"
          component={SettingsScreen}
          options={{ title: t('settings.title') }}
        />
        <Stack.Screen name="About" component={AboutScreen} options={{ title: t('about.title') }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
