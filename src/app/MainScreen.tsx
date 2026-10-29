import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import { BackHandler, ScrollView, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { ExportButton } from '@/features/backup';
import { Calendar } from '@/features/history';
import { StatsList } from '@/features/progress';
import { AppText, PageDots, Screen } from '@/ui';

import { HomePage } from './HomePage';
import type { RootStackParamList } from './navigation';

const PAGE_COUNT = 3;

/** Home, Calendar and Stats side by side; swipe left and right between them. */
export function MainScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Main'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollView>(null);
  const [page, setPage] = useState(0);
  const [focusCount, setFocusCount] = useState(0);
  // Edits on one page (e.g. bodyweight on Calendar) refresh the others.
  const [dataVersion, setDataVersion] = useState(0);
  const reloadToken = focusCount + dataVersion;
  const onChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  useFocusEffect(useCallback(() => setFocusCount((n) => n + 1), []));

  // Android back from Calendar or Stats returns to Home instead of leaving the app.
  useFocusEffect(
    useCallback(() => {
      if (page === 0) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        pager.current?.scrollTo({ x: 0, animated: true });
        setPage(0);
        return true;
      });
      return () => sub.remove();
    }, [page]),
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        <View style={{ width }}>
          <HomePage navigation={navigation} reloadToken={reloadToken} />
        </View>
        <View style={{ width }}>
          <Calendar
            top
            reloadToken={reloadToken}
            onChanged={onChanged}
            onOpenWorkout={(workout) =>
              navigation.navigate('LogWorkout', {
                workoutId: workout.id,
                mode: 'edit',
                title: workout.name ?? t('logging.editTitle'),
              })
            }
            footer={<ExportButton />}
          />
        </View>
        <View style={{ width }}>
          <Screen top>
            <AppText variant="title">{t('stats.title')}</AppText>
            <StatsList
              reloadToken={reloadToken}
              onOpen={(target) => navigation.navigate('StatsDetail', { target })}
            />
          </Screen>
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']}>
        <PageDots count={PAGE_COUNT} active={page} />
      </SafeAreaView>
    </View>
  );
}
