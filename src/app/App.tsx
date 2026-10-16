import { ChangaOne_400Regular } from '@expo-google-fonts/changa-one';
import {
  NotoSans_400Regular,
  NotoSans_600SemiBold,
  NotoSans_700Bold,
} from '@expo-google-fonts/noto-sans';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DbProvider } from '@/core/db';
import { openExpoDb } from '@/core/db/expoDb';
import { useTranslation } from '@/core/i18n';
import { SettingsProvider } from '@/core/settings';
import { darkTheme, useTheme } from '@/core/theme';

import { bootstrap, type AppContext } from './bootstrap';
import { RootNavigation } from './navigation';

type State =
  { status: 'loading' } | { status: 'ready'; ctx: AppContext } | { status: 'error'; error: Error };

export default function App() {
  const [state, setState] = useState<State>({ status: 'loading' });
  // If fonts fail to load the app still starts, with the system font.
  const [fontsLoaded, fontError] = useFonts({
    ChangaOne_400Regular,
    NotoSans_400Regular,
    NotoSans_600SemiBold,
    NotoSans_700Bold,
  });

  useEffect(() => {
    // The native window shows through during screen transitions; keep it dark, not white.
    void SystemUI.setBackgroundColorAsync(darkTheme.colors.background);
  }, []);

  useEffect(() => {
    bootstrap(() => openExpoDb())
      .then((ctx) => setState({ status: 'ready', ctx }))
      .catch((error: unknown) =>
        setState({
          status: 'error',
          error: error instanceof Error ? error : new Error(String(error)),
        }),
      );
  }, []);

  if (state.status !== 'ready') return <StartupScreen state={state} />;
  if (!fontsLoaded && !fontError) return <StartupScreen state={{ status: 'loading' }} />;

  const { ctx } = state;
  return (
    <SafeAreaProvider>
      <DbProvider db={ctx.db}>
        <SettingsProvider initial={ctx.settings} save={ctx.settingsRepository.save}>
          <ThemedStatusBar />
          <RootNavigation />
        </SettingsProvider>
      </DbProvider>
    </SafeAreaProvider>
  );
}

function ThemedStatusBar() {
  const theme = useTheme();
  return <StatusBar style={theme.dark ? 'light' : 'dark'} />;
}

/** Shown before settings load, so it can't use the themed components. */
function StartupScreen({ state }: { state: Exclude<State, { status: 'ready' }> }) {
  const { t } = useTranslation();
  return (
    <View style={styles.center}>
      {state.status === 'loading' ? (
        <ActivityIndicator color={darkTheme.colors.accent} accessibilityLabel={t('app.loading')} />
      ) : (
        <>
          <Text style={styles.errorTitle}>{t('app.startupError')}</Text>
          <Text style={styles.errorText}>
            {t('app.startupErrorDetail', { message: state.error.message })}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
    backgroundColor: darkTheme.colors.background,
  },
  errorTitle: { fontSize: 18, fontWeight: '600', color: darkTheme.colors.text },
  errorText: { color: darkTheme.colors.text },
});
