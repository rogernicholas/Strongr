import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useRef, useState } from 'react';
import {
  BackHandler,
  ScrollView,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { ExportButton } from '@/features/backup';
import { Calendar } from '@/features/history';
import { StatsList } from '@/features/progress';
import { AppText, Screen, TabBar } from '@/ui';

import { HomePage } from './HomePage';
import type { RootStackParamList } from './navigation';

/** Home, Calendar and Stats side by side; swipe between them or tap the tabs. */
export function MainScreen({ navigation }: NativeStackScreenProps<RootStackParamList, 'Main'>) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const pager = useRef<ScrollViewInstance>(null);
  const [page, setPage] = useState(0);
  const [focusCount, setFocusCount] = useState(0);
  // Edits on one page (e.g. bodyweight on Calendar) refresh the others.
  const [dataVersion, setDataVersion] = useState(0);
  const reloadToken = focusCount + dataVersion;
  const onChanged = useCallback(() => setDataVersion((v) => v + 1), []);

  useFocusEffect(useCallback(() => setFocusCount((n) => n + 1), []));

  const goTo = useCallback(
    (index: number) => {
      pager.current?.scrollTo({ x: index * width, animated: true });
      setPage(index);
    },
    [width],
  );

  // Android back from Calendar or Stats returns to Home instead of leaving the app.
  useFocusEffect(
    useCallback(() => {
      if (page === 0) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        goTo(0);
        return true;
      });
      return () => sub.remove();
    }, [page, goTo]),
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
              onChanged={onChanged}
              onOpen={(target) => navigation.navigate('StatsDetail', { target })}
            />
          </Screen>
        </View>
      </ScrollView>
      <SafeAreaView edges={['bottom']}>
        <TabBar
          labels={[t('home.tab'), t('home.calendarTab'), t('stats.title')]}
          active={page}
          onSelect={goTo}
        />
      </SafeAreaView>
    </View>
  );
}
