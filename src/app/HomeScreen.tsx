import type { NavigationProp } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatLongDate } from '@/core/dates';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { createWorkoutRepository } from '@/data';
import { AppText, Button, Card, LinkButton } from '@/ui';

import type { RootStackParamList } from './navigation';

interface Props {
  navigation: NavigationProp<RootStackParamList>;
  /** Changes whenever the main screen regains focus. */
  reloadToken: number;
}

/** First page of the main pager: just start (or resume) a workout. */
export function HomePage({ navigation, reloadToken }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const [activeWorkoutId, setActiveWorkoutId] = useState<string | null>(null);
  const today = new Date();

  useEffect(() => {
    let active = true;
    void createWorkoutRepository(db)
      .findActive()
      .then((id) => active && setActiveWorkoutId(id));
    return () => {
      active = false;
    };
  }, [db, reloadToken]);

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, padding: theme.spacing(4), backgroundColor: theme.colors.background }}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: theme.spacing(6) }}>
        <View style={{ alignItems: 'center' }}>
          <AppText variant="logo">{t('app.logo')}</AppText>
          <AppText variant="muted">{formatLongDate(today, i18n.language)}</AppText>
        </View>

        <View style={{ gap: theme.spacing(3) }}>
          {activeWorkoutId ? (
            <Card
              accessibilityLabel={t('home.resume')}
              onPress={() => navigation.navigate('LogWorkout', { workoutId: activeWorkoutId })}
            >
              <AppText style={{ fontSize: 18, fontWeight: '600' }}>{t('home.resume')}</AppText>
              <AppText variant="muted">{t('home.resumeHint')}</AppText>
            </Card>
          ) : (
            <Button
              label={t('home.newWorkout')}
              onPress={() => navigation.navigate('PickExercises', {})}
            />
          )}
          <Button
            label={t('home.myRoutines')}
            variant="secondary"
            onPress={() => navigation.navigate('Routines')}
          />
        </View>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
        <LinkButton label={t('home.settings')} onPress={() => navigation.navigate('Settings')} />
        <LinkButton label={t('home.about')} onPress={() => navigation.navigate('About')} />
      </View>
    </SafeAreaView>
  );
}
