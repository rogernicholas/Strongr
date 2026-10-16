import { useEffect, useState } from 'react';
import { Pressable, ScrollView, useWindowDimensions, View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { createExerciseRepository, createRoutineRepository, type Routine } from '@/data';
import { AppText } from '@/ui';

interface Props {
  selectedId?: string;
  onSelect(routine: Routine): void;
  /** Change this to reload, e.g. after saving a new routine. */
  reloadToken?: string | number;
}

const GAP = 10;

/** Saved routines as a swipeable row of cards, one at a time with the next peeking in. */
export function RoutineCarousel({ selectedId, onSelect, reloadToken }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const { width } = useWindowDimensions();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [names, setNames] = useState<Map<string, string>>(new Map());
  // Screen padding is 16 on each side; leave 40 so the next card shows.
  const cardWidth = width - 32 - 40;

  useEffect(() => {
    let active = true;
    void Promise.all([
      createRoutineRepository(db).list(),
      createExerciseRepository(db).list(),
    ]).then(([r, e]) => {
      if (!active) return;
      setRoutines(r);
      setNames(new Map(e.map((x) => [x.id, x.name])));
    });
    return () => {
      active = false;
    };
  }, [db, reloadToken]);

  if (routines.length === 0) return null;

  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label">{t('routines.title').toUpperCase()}</AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        contentContainerStyle={{ gap: GAP }}
        accessibilityLabel={t('routines.title')}
      >
        {routines.map((routine) => {
          const selected = routine.id === selectedId;
          return (
            <Pressable
              key={routine.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityHint={t('routines.useHint')}
              onPress={() => onSelect(routine)}
              style={({ pressed }) => ({
                width: cardWidth,
                padding: 14,
                gap: 4,
                borderRadius: theme.radius.md,
                borderWidth: selected ? 2 : 1,
                borderColor: selected ? theme.colors.accent : theme.colors.border,
                backgroundColor: theme.colors.raised,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="heading">{routine.name}</AppText>
                <AppText variant="label" style={selected ? { color: theme.colors.accent } : {}}>
                  {selected ? t('routines.selected') : t('routines.tapToUse')}
                </AppText>
              </View>
              <AppText variant="muted" numberOfLines={2}>
                {routine.exerciseIds.map((id) => names.get(id)).join(' · ')}
              </AppText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
