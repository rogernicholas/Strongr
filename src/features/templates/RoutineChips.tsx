import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { createRoutineRepository, type Routine } from '@/data';
import { AppText } from '@/ui';

interface Props {
  selectedId?: string;
  onSelect(routine: Routine): void;
  /** Change this to reload, e.g. after saving a new routine. */
  reloadToken?: string | number;
}

/** Saved routines as a row of chips. Tap to load one, long-press to delete. */
export function RoutineChips({ selectedId, onSelect, reloadToken }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const [routines, setRoutines] = useState<Routine[]>([]);

  useEffect(() => {
    let active = true;
    void createRoutineRepository(db)
      .list()
      .then((r) => active && setRoutines(r));
    return () => {
      active = false;
    };
  }, [db, reloadToken]);

  function confirmDelete(routine: Routine) {
    Alert.alert(t('routines.deleteTitle', { name: routine.name }), t('routines.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void createRoutineRepository(db)
            .remove(routine.id)
            .then(() => setRoutines((cur) => cur.filter((r) => r.id !== routine.id)));
        },
      },
    ]);
  }

  if (routines.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 8 }}
      accessibilityLabel={t('routines.chipsLabel')}
    >
      {routines.map((routine) => {
        const selected = routine.id === selectedId;
        return (
          <Pressable
            key={routine.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityHint={t('routines.chipHint')}
            onPress={() => onSelect(routine)}
            onLongPress={() => confirmDelete(routine)}
            style={{
              minHeight: 40,
              paddingHorizontal: 16,
              borderRadius: 20,
              borderWidth: 1,
              justifyContent: 'center',
              borderColor: selected ? theme.colors.accent : theme.colors.border,
              backgroundColor: selected ? theme.colors.accent : theme.colors.surface,
            }}
          >
            <AppText
              style={{
                fontWeight: '600',
                color: selected ? theme.colors.onAccent : theme.colors.text,
              }}
            >
              {routine.name}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
