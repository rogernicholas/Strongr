import { useState } from 'react';
import { View } from 'react-native';

import { MUSCLE_GROUPS, type MuscleGroup } from '@/config/muscleGroups';
import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { createExerciseRepository, DuplicateExerciseError, type Exercise } from '@/data';
import { AppText, Button, Chips, TextField } from '@/ui';

interface Props {
  initialName: string;
  onCreated(exercise: Exercise): void;
  onCancel(): void;
}

export function AddExerciseForm({ initialName, onCreated, onCancel }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const [name, setName] = useState(initialName);
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!name.trim() || !muscleGroup) return;
    try {
      onCreated(await createExerciseRepository(db).create({ name, muscleGroup }));
    } catch (e) {
      setError(
        e instanceof DuplicateExerciseError ? t('exercises.duplicate') : t('common.saveFailed'),
      );
    }
  }

  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
      }}
    >
      <AppText variant="label">{t('exercises.newExercise')}</AppText>
      <TextField
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
        placeholder={t('exercises.namePlaceholder')}
        autoFocus
        inset
      />
      <Chips<MuscleGroup>
        value={muscleGroup}
        onChange={setMuscleGroup}
        inset
        options={MUSCLE_GROUPS.map((g) => ({ value: g, label: t(`muscleGroups.${g}`) }))}
      />
      {error ? <AppText style={{ color: theme.colors.danger }}>{error}</AppText> : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Button label={t('common.cancel')} variant="quiet" onPress={onCancel} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            label={t('exercises.add')}
            onPress={() => void save()}
            disabled={!name.trim() || !muscleGroup}
          />
        </View>
      </View>
    </View>
  );
}
