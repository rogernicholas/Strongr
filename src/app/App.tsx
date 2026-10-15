import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DbProvider } from '@/core/db';
import { openExpoDb } from '@/core/db/expoDb';
import { useTranslation } from '@/core/i18n';
import { SettingsProvider } from '@/core/settings';
import { useTheme } from '@/core/theme';

import { bootstrap, type AppContext } from './bootstrap';
import { RootNavigation } from './navigation';

type State =
  { status: 'loading' } | { status: 'ready'; ctx: AppContext } | { status: 'error'; error: Error };

export default function App() {
  const [state, setState] = useState<State>({ status: 'loading' });

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
        <ActivityIndicator accessibilityLabel={t('app.loading')} />
      ) : (
        <>
          <Text style={styles.errorTitle}>{t('app.startupError')}</Text>
          <Text>{t('app.startupErrorDetail', { message: state.error.message })}</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
  errorTitle: { fontSize: 18, fontWeight: '600' },
});
