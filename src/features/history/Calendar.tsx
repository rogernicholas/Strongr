import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, View } from 'react-native';

import {
  formatLongDate,
  formatMonth,
  localDateKey,
  monthGrid,
  monthRange,
  parseDateKey,
} from '@/core/dates';
import { useDb } from '@/core/db';
import { formatSetShort } from '@/core/format';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { useTheme } from '@/core/theme';
import { createWorkoutRepository, type Workout } from '@/data';
import { AppText, Card, Screen } from '@/ui';

/** Monday-first short weekday names, e.g. ["Mon", …, "Sun"]. */
function weekdayNames(language: string): string[] {
  const fmt = new Intl.DateTimeFormat(language, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 9, 12 + i)));
}

export function Calendar() {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const { settings } = useSettings();
  const today = new Date();
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(localDateKey(today));
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let active = true;
    const { from, to } = monthRange(month.year, month.month);
    void createWorkoutRepository(db)
      .listFinished(from, to)
      .then((w) => active && setWorkouts(w));
    return () => {
      active = false;
    };
  }, [db, month, version]);

  const byDay = useMemo(() => {
    const map = new Map<string, Workout[]>();
    for (const w of workouts) {
      const key = localDateKey(new Date(w.startedAt));
      map.set(key, [...(map.get(key) ?? []), w]);
    }
    return map;
  }, [workouts]);

  const shiftMonth = (delta: number) =>
    setMonth(({ year, month: m }) => {
      const d = new Date(year, m + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });

  function confirmDelete(workout: Workout) {
    Alert.alert(t('history.deleteTitle'), t('history.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () =>
          void createWorkoutRepository(db)
            .remove(workout.id)
            .then(() => setVersion((v) => v + 1)),
      },
    ]);
  }

  const todayKey = localDateKey(today);
  const dayWorkouts = byDay.get(selected) ?? [];
  const arrow = (delta: number, label: string) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => shiftMonth(delta)}
      style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}
    >
      <AppText style={{ fontSize: 24 }}>{delta < 0 ? '‹' : '›'}</AppText>
    </Pressable>
  );

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        {arrow(-1, t('history.previousMonth'))}
        <AppText style={{ fontSize: 18, fontWeight: '600' }}>
          {formatMonth(new Date(month.year, month.month, 1), i18n.language)}
        </AppText>
        {arrow(1, t('history.nextMonth'))}
      </View>

      <View>
        <View style={{ flexDirection: 'row' }}>
          {weekdayNames(i18n.language).map((name) => (
            <AppText key={name} variant="label" style={{ flex: 1, textAlign: 'center' }}>
              {name}
            </AppText>
          ))}
        </View>
        {monthGrid(month.year, month.month).map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row' }}>
            {week.map((day, di) => {
              if (!day) return <View key={di} style={{ flex: 1, height: 48 }} />;
              const key = localDateKey(day);
              const isSelected = key === selected;
              const hasWorkout = byDay.has(key);
              return (
                <Pressable
                  key={di}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={formatLongDate(day, i18n.language)}
                  onPress={() => setSelected(key)}
                  style={{
                    flex: 1,
                    height: 48,
                    margin: 1,
                    borderRadius: 10,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isSelected ? theme.colors.primary : 'transparent',
                    borderWidth: key === todayKey ? 1 : 0,
                    borderColor: theme.colors.primary,
                  }}
                >
                  <AppText
                    style={{ color: isSelected ? theme.colors.onPrimary : theme.colors.text }}
                  >
                    {day.getDate()}
                  </AppText>
                  <View
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      marginTop: 2,
                      backgroundColor: hasWorkout
                        ? isSelected
                          ? theme.colors.onPrimary
                          : theme.colors.primary
                        : 'transparent',
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <AppText variant="label">
        {formatLongDate(parseDateKey(selected), i18n.language).toUpperCase()}
      </AppText>
      {dayWorkouts.length === 0 ? (
        <AppText variant="muted">{t('history.restDay')}</AppText>
      ) : (
        dayWorkouts.map((workout) => (
          <Card key={workout.id} onLongPress={() => confirmDelete(workout)}>
            {workout.name ? (
              <AppText style={{ fontSize: 18, fontWeight: '600' }}>{workout.name}</AppText>
            ) : null}
            {workout.exercises
              .filter((e) => e.sets.length > 0)
              .map((e) => (
                <AppText key={e.id}>
                  <AppText style={{ fontWeight: '600' }}>{e.exerciseName}</AppText>
                  {'  '}
                  {e.sets.map((s) => formatSetShort(s, settings.weightUnit)).join(', ')}
                </AppText>
              ))}
            <AppText variant="muted">{t('history.longPressHint')}</AppText>
          </Card>
        ))
      )}
    </Screen>
  );
}
