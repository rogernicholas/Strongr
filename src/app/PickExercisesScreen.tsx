import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ToastAndroid, View } from 'react-native';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { createRoutineRepository, createWorkoutRepository } from '@/data';
import { ExercisePicker } from '@/features/exercises';
import {
  hasRoutineChanges,
  RoutineCarousel,
  SaveRoutineDialog,
  suggestRoutineName,
} from '@/features/templates';
import { AppText, Button, TextField } from '@/ui';

import type { RootStackParamList } from './navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'PickExercises'>;

/** Composes the exercise picker with routine saving (features can't import each other). */
export function PickExercisesScreen({ route, navigation }: Props) {
  const { t } = useTranslation();
  const db = useDb();
  const { routineId, routineName, exerciseIds, addToWorkoutId, newRoutine, editRoutine } =
    route.params;
  const [name, setName] = useState(routineName ?? '');
  const renamed = editRoutine === true && name.trim() !== '' && name.trim() !== routineName;
  const [saveDialog, setSaveDialog] = useState<{ ids: string[]; suggestion: string } | null>(null);
  // Bumped on open so the dialog remounts with the new suggestion but still fades out on close.
  const [dialogKey, setDialogKey] = useState(0);
  // Bumped after a save so the routine cards show the saved exercises.
  const [routinesVersion, setRoutinesVersion] = useState(0);

  async function openSaveDialog(ids: string[]) {
    const existing = await createRoutineRepository(db).list();
    setDialogKey((k) => k + 1);
    setSaveDialog({ ids, suggestion: suggestRoutineName(existing.map((r) => r.name)) });
  }

  async function saveNew(name: string) {
    if (!saveDialog) return;
    const routine = await createRoutineRepository(db).create(name, saveDialog.ids);
    setSaveDialog(null);
    setRoutinesVersion((v) => v + 1);
    ToastAndroid.show(t('routines.saved', { name: routine.name }), ToastAndroid.SHORT);
    if (newRoutine) {
      navigation.goBack();
      return;
    }
    navigation.setParams({
      routineId: routine.id,
      routineName: routine.name,
      exerciseIds: saveDialog.ids,
    });
  }

  async function saveChanges(ids: string[]) {
    if (!routineId || !routineName) return;
    const newName = renamed ? name.trim() : routineName;
    await createRoutineRepository(db).update(routineId, { exerciseIds: ids, name: newName });
    setRoutinesVersion((v) => v + 1);
    // The routine now matches the screen, so the Save changes button hides.
    navigation.setParams({ exerciseIds: ids, routineName: newName });
    ToastAndroid.show(t('routines.saved', { name: newName }), ToastAndroid.SHORT);
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

  const saveDialogNode = (
    <SaveRoutineDialog
      key={dialogKey}
      visible={saveDialog !== null}
      initialName={saveDialog?.suggestion ?? ''}
      onCancel={() => setSaveDialog(null)}
      onSave={(name) => void saveNew(name)}
    />
  );

  if (newRoutine) {
    return (
      <>
        <ExercisePicker
          renderFooter={(ids) => (
            <Button
              label={t('routines.saveAs')}
              disabled={ids.length === 0}
              onPress={() => void openSaveDialog(ids)}
            />
          )}
        />
        {saveDialogNode}
      </>
    );
  }

  return (
    <>
      <ExercisePicker
        // Picking a routine makes its exercises the selection.
        selectionKey={routineId ?? 'new'}
        initialSelectedIds={exerciseIds}
        header={
          editRoutine ? (
            <View style={{ gap: 8 }}>
              <TextField
                value={name}
                onChangeText={setName}
                placeholder={t('routines.name')}
                accessibilityLabel={t('routines.name')}
                maxLength={40}
              />
              <AppText variant="muted">{t('routines.orderHint')}</AppText>
            </View>
          ) : (
            <RoutineCarousel
              selectedId={routineId}
              reloadToken={routinesVersion}
              onSelect={(routine) =>
                navigation.setParams({
                  routineId: routine.id,
                  routineName: routine.name,
                  exerciseIds: routine.exerciseIds,
                })
              }
            />
          )
        }
        renderFooter={(ids) => (
          <View style={{ gap: 8 }}>
            {!routineId ? (
              <Button
                label={t('routines.saveAs')}
                variant="secondary"
                disabled={ids.length === 0}
                onPress={() => void openSaveDialog(ids)}
              />
            ) : renamed || hasRoutineChanges(exerciseIds ?? [], ids) ? (
              <Button
                label={t('routines.saveChanges')}
                variant="secondary"
                disabled={ids.length === 0}
                onPress={() => void saveChanges(ids)}
              />
            ) : null}
            <Button
              label={t('routines.startWorkout')}
              disabled={ids.length === 0}
              onPress={() => void start(ids)}
            />
          </View>
        )}
      />
      {saveDialogNode}
    </>
  );
}
