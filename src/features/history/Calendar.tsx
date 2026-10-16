import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Pressable, View } from 'react-native';

import {
  formatLongDate,
  formatMonth,
  localDateKey,
  monthGrid,
  monthRange,
  parseDateKey,
  weekStartKey,
} from '@/core/dates';
import { useDb } from '@/core/db';
import { formatSetShort } from '@/core/format';
import { useTranslation } from '@/core/i18n';
import { useSettings } from '@/core/settings';
import { useTheme } from '@/core/theme';
import { formatNumber, fromDisplayWeight, toDisplayWeight } from '@/core/units';
import { createBodyweightRepository, createWorkoutRepository, type Workout } from '@/data';
import { AppText, Card, Screen } from '@/ui';

import { BodyweightDialog } from './BodyweightDialog';

/** Monday-first short weekday names, e.g. ["Mon", …, "Sun"]. */
function weekdayNames(language: string): string[] {
  const fmt = new Intl.DateTimeFormat(language, { weekday: 'short' });
  return Array.from({ length: 7 }, (_, i) => fmt.format(new Date(2026, 9, 12 + i)));
}

interface Props {
  /** Shown under the day's workouts, e.g. the export link. */
  footer?: ReactNode;
  /** Change this to reload, e.g. when the screen regains focus. */
  reloadToken?: number;
  /** Pad for the status bar; for use without a header. */
  top?: boolean;
}

const WEEK_CELL = 48;

export function Calendar({ footer, reloadToken, top }: Props) {
  const { t, i18n } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const { settings } = useSettings();
  const today = new Date();
  const [month, setMonth] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [selected, setSelected] = useState(localDateKey(today));
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [version, setVersion] = useState(0);
  const [bodyweights, setBodyweights] = useState<Map<string, number>>(new Map());
  const [editingWeek, setEditingWeek] = useState<string | null>(null);
  const unit = settings.weightUnit;

  useEffect(() => {
    let active = true;
    const { from, to } = monthRange(month.year, month.month);
    void createWorkoutRepository(db)
      .listFinished(from, to)
      .then((w) => active && setWorkouts(w));
    return () => {
      active = false;
    };
  }, [db, month, version, reloadToken]);

  useEffect(() => {
    let active = true;
    void createBodyweightRepository(db)
      .list()
      .then(
        (list) => active && setBodyweights(new Map(list.map((b) => [b.weekStart, b.weightKg]))),
      );
    return () => {
      active = false;
    };
  }, [db, version, reloadToken]);

  async function saveBodyweight(value: number) {
    if (!editingWeek) return;
    await createBodyweightRepository(db).set(editingWeek, fromDisplayWeight(value, unit));
    setEditingWeek(null);
    setVersion((v) => v + 1);
  }

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

  function weekCell(week: (Date | null)[]) {
    const firstDay = week.find((d): d is Date => d !== null);
    if (!firstDay) return <View style={{ width: WEEK_CELL }} />;
    const weekStart = weekStartKey(firstDay);
    const kg = bodyweights.get(weekStart);
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('history.bodyweightTitle')}
        onPress={() => setEditingWeek(weekStart)}
        style={({ pressed }) => ({
          width: WEEK_CELL,
          height: 40,
          marginLeft: 4,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <AppText
          style={{
            fontSize: 13,
            color: kg === undefined ? theme.colors.textMuted : theme.colors.text,
          }}
        >
          {kg === undefined ? '+' : formatNumber(toDisplayWeight(kg, unit), 1)}
        </AppText>
      </Pressable>
    );
  }

  return (
    <Screen top={top}>
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
          <AppText variant="label" style={{ width: WEEK_CELL, textAlign: 'center' }}>
            {unit}
          </AppText>
        </View>
        {monthGrid(month.year, month.month).map((week, wi) => (
          <View key={wi} style={{ flexDirection: 'row', alignItems: 'center' }}>
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
                    backgroundColor: isSelected ? theme.colors.accent : 'transparent',
                    borderWidth: key === todayKey ? 1 : 0,
                    borderColor: theme.colors.accent,
                  }}
                >
                  <AppText
                    style={{ color: isSelected ? theme.colors.onAccent : theme.colors.text }}
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
                          ? theme.colors.onAccent
                          : theme.colors.accent
                        : 'transparent',
                    }}
                  />
                </Pressable>
              );
            })}
            {weekCell(week)}
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
                  {e.sets.map((s) => formatSetShort(s, unit)).join(', ')}
                </AppText>
              ))}
            <AppText variant="muted">{t('history.longPressHint')}</AppText>
          </Card>
        ))
      )}
      {footer}
      <BodyweightDialog
        weekStart={editingWeek}
        currentKg={editingWeek ? (bodyweights.get(editingWeek) ?? null) : null}
        unit={unit}
        onSave={(value) => void saveBodyweight(value)}
        onCancel={() => setEditingWeek(null)}
      />
    </Screen>
  );
}
