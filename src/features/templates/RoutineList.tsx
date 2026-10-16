import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createExerciseRepository, createRoutineRepository, type Routine } from '@/data';
import { AppText, Card, useDialog } from '@/ui';

interface Props {
  onSelect(routine: Routine): void;
  /** Change this to reload, e.g. when the screen regains focus. */
  reloadToken?: number;
}

export function RoutineList({ onSelect, reloadToken }: Props) {
  const { t } = useTranslation();
  const db = useDb();
  const dialog = useDialog();
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

  async function confirmDelete(routine: Routine) {
    const ok = await dialog({
      title: t('routines.deleteTitle', { name: routine.name }),
      message: t('routines.deleteBody'),
      confirmLabel: t('common.delete'),
      cancelLabel: t('common.cancel'),
      destructive: true,
    });
    if (!ok) return;
    await createRoutineRepository(db).remove(routine.id);
    setRoutines((cur) => cur?.filter((r) => r.id !== routine.id) ?? null);
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
          onLongPress={() => void confirmDelete(routine)}
          accessibilityLabel={routine.name}
        >
          <AppText variant="heading">{routine.name}</AppText>
          <AppText variant="muted" numberOfLines={2}>
            {routine.exerciseIds.map((id) => names.get(id)).join(' · ')}
          </AppText>
        </Card>
      ))}
      <AppText variant="muted">{t('routines.longPressHint')}</AppText>
    </View>
  );
}
