import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ToastAndroid, View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createRoutineRepository } from '@/data';
import { ExercisePicker } from '@/features/exercises';
import { SaveRoutineDialog, suggestRoutineName } from '@/features/templates';
import { AppText, Button } from '@/ui';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PickExercises'>;

/** Composes the exercise picker with routine saving (features can't import each other). */
export function PickExercisesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const db = useDb();
  const { routineId, routineName, exerciseIds } = route.params;
  const [saveDialog, setSaveDialog] = useState<{ ids: string[]; suggestion: string } | null>(null);

  async function openSaveDialog(ids: string[]) {
    const existing = await createRoutineRepository(db).list();
    setSaveDialog({ ids, suggestion: suggestRoutineName(existing.map((r) => r.name)) });
  }

  async function saveNew(name: string) {
    if (!saveDialog) return;
    const routine = await createRoutineRepository(db).create(name, saveDialog.ids);
    setSaveDialog(null);
    ToastAndroid.show(t('routines.saved', { name: routine.name }), ToastAndroid.SHORT);
    navigation.setParams({
      routineId: routine.id,
      routineName: routine.name,
      exerciseIds: saveDialog.ids,
    });
  }

  async function updateExisting(ids: string[]) {
    if (!routineId || !routineName) return;
    await createRoutineRepository(db).update(routineId, { exerciseIds: ids });
    ToastAndroid.show(t('routines.saved', { name: routineName }), ToastAndroid.SHORT);
  }

  return (
    <>
      <ExercisePicker
        initialSelectedIds={exerciseIds}
        renderFooter={(ids) => (
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('routines.saveAs')}
                  variant="secondary"
                  disabled={ids.length === 0}
                  onPress={() => void openSaveDialog(ids)}
                />
              </View>
              {routineId && routineName ? (
                <View style={{ flex: 1 }}>
                  <Button
                    label={t('routines.update', { name: routineName })}
                    variant="secondary"
                    disabled={ids.length === 0}
                    onPress={() => void updateExisting(ids)}
                  />
                </View>
              ) : null}
            </View>
            <Button label={t('routines.startWorkout')} disabled onPress={() => {}} />
            <AppText variant="muted">{t('routines.startComingSoon')}</AppText>
          </View>
        )}
      />
      <SaveRoutineDialog
        visible={saveDialog !== null}
        initialName={saveDialog?.suggestion ?? ''}
        onCancel={() => setSaveDialog(null)}
        onSave={(name) => void saveNew(name)}
      />
    </>
  );
}
