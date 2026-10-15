import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createExerciseRepository, createRoutineRepository, type Routine } from '@/data';
import { AppText, Card } from '@/ui';

interface Props {
  onSelect(routine: Routine): void;
  /** Change this to reload, e.g. when the screen regains focus. */
  reloadToken?: number;
}

export function RoutineList({ onSelect, reloadToken }: Props) {
  const { t } = useTranslation();
  const db = useDb();
  const [routines, setRoutines] = useState<Routine[] | null>(null);
  const [names, setNames] = useState<Map<string, string>>(new Map());

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

  function confirmDelete(routine: Routine) {
    Alert.alert(t('routines.deleteTitle', { name: routine.name }), t('routines.deleteBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: () => {
          void createRoutineRepository(db)
            .remove(routine.id)
            .then(() => setRoutines((cur) => cur?.filter((r) => r.id !== routine.id) ?? null));
        },
      },
    ]);
  }

  if (!routines) return null;
  if (routines.length === 0) {
    return <AppText variant="muted">{t('routines.empty')}</AppText>;
  }

  return (
    <View style={{ gap: 8 }}>
      {routines.map((routine) => (
        <Card
          key={routine.id}
          onPress={() => onSelect(routine)}
          onLongPress={() => confirmDelete(routine)}
          accessibilityLabel={routine.name}
        >
          <AppText style={{ fontSize: 18, fontWeight: '600' }}>{routine.name}</AppText>
          <AppText variant="muted" numberOfLines={2}>
            {routine.exerciseIds.map((id) => names.get(id)).join(' · ')}
          </AppText>
        </Card>
      ))}
      <AppText variant="muted">{t('routines.longPressHint')}</AppText>
    </View>
  );
}
