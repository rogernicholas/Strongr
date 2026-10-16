import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ToastAndroid, View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createRoutineRepository, createWorkoutRepository } from '@/data';
import { ExercisePicker } from '@/features/exercises';
import { RoutineCarousel, SaveRoutineDialog, suggestRoutineName } from '@/features/templates';
import { Button } from '@/ui';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PickExercises'>;

/** Composes the exercise picker with routine saving (features can't import each other). */
export function PickExercisesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const db = useDb();
  const { routineId, routineName, exerciseIds, addToWorkoutId } = route.params;
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

  async function start(ids: string[]) {
    const workoutId = await createWorkoutRepository(db).start({
      exerciseIds: ids,
      templateId: routineId ?? null,
      name: routineName ?? null,
    });
    navigation.replace('LogWorkout', { workoutId, title: routineName });
  }

  async function addToWorkout(workoutId: string, ids: string[]) {
    await createWorkoutRepository(db).addExercises(workoutId, ids);
    navigation.goBack();
  }

  if (addToWorkoutId) {
    return (
      <ExercisePicker
        renderFooter={(ids) => (
          <Button
            label={t('logging.addToWorkout')}
            disabled={ids.length === 0}
            onPress={() => void addToWorkout(addToWorkoutId, ids)}
          />
        )}
      />
    );
  }

  return (
    <>
      <ExercisePicker
        // Remount when a routine is picked so its exercises become the selection.
        key={routineId ?? 'new'}
        initialSelectedIds={exerciseIds}
        header={
          <RoutineCarousel
            selectedId={routineId}
            reloadToken={routineId}
            onSelect={(routine) =>
              navigation.setParams({
                routineId: routine.id,
                routineName: routine.name,
                exerciseIds: routine.exerciseIds,
              })
            }
          />
        }
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
            <Button
              label={t('routines.startWorkout')}
              disabled={ids.length === 0}
              onPress={() => void start(ids)}
            />
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
