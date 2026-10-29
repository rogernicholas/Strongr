import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import type { WeightUnit } from '@/core/units';
import { useFormatSet } from '@/core/useFormatSet';
import type { LoggedSet, SetInput, WorkoutExercise } from '@/data';
import { AppText } from '@/ui';

import { SetEditor } from './SetEditor';
import { suggestNextSet } from './setEntry';

interface Props {
  exercise: WorkoutExercise;
  previousSets: LoggedSet[];
  unit: WeightUnit;
  rpeEnabled: boolean;
  expanded: boolean;
  onToggle(): void;
  onAddSet(input: SetInput): void;
  onUpdateSet(setId: string, input: SetInput): void;
  onDeleteSet(setId: string): void;
}

export function ExerciseLogCard(props: Props) {
  const { exercise, previousSets, unit, rpeEnabled, expanded } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const formatSet = useFormatSet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = exercise.sets.find((s) => s.id === editingId) ?? null;

  const lastTime = previousSets.map(formatSet).join(', ');
  const suggestion = suggestNextSet(exercise.sets, previousSets);

  return (
    <View
      style={{
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: expanded ? theme.colors.accent : theme.colors.border,
        backgroundColor: theme.colors.surface,
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={props.onToggle}
        style={{ padding: 16, gap: 4 }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <AppText variant="heading" style={{ flex: 1 }}>
            {exercise.exerciseName}
          </AppText>
          <AppText variant="muted">
            {t('logging.setCount', { count: exercise.sets.length })}
          </AppText>
        </View>
        <AppText variant="muted">
          {lastTime ? t('logging.lastTime', { sets: lastTime }) : t('logging.firstTime')}
        </AppText>
      </Pressable>

      {exercise.sets.length > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: expanded ? 0 : 12, gap: 4 }}>
          {exercise.sets.map((set, i) => (
            <Pressable
              key={set.id}
              accessibilityRole="button"
              accessibilityHint={t('logging.tapToEdit')}
              onPress={() => setEditingId(set.id === editingId ? null : set.id)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                minHeight: 40,
                paddingHorizontal: 8,
                borderRadius: theme.radius.sm,
                backgroundColor: set.id === editingId ? theme.colors.background : 'transparent',
              }}
            >
              <AppText variant="muted" style={{ width: 20 }}>
                {i + 1}
              </AppText>
              <AppText variant="heading" style={{ flex: 1 }}>
                {formatSet(set)}
                {set.rpe !== null ? `  @${set.rpe}` : ''}
              </AppText>
              {set.isWarmup ? <AppText variant="muted">{t('logging.warmupShort')}</AppText> : null}
            </Pressable>
          ))}
        </View>
      ) : null}

      {expanded ? (
        <View style={{ padding: 16, gap: 12 }}>
          {editing ? (
            <SetEditor
              key={`edit-${editing.id}`}
              tracks={exercise.tracks}
              unit={unit}
              rpeEnabled={rpeEnabled}
              initial={editing}
              submitLabel={t('logging.saveSet')}
              onSubmit={(input) => {
                props.onUpdateSet(editing.id, input);
                setEditingId(null);
              }}
              onDelete={() => {
                props.onDeleteSet(editing.id);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <SetEditor
              key={`new-${exercise.sets.length}`}
              tracks={exercise.tracks}
              unit={unit}
              rpeEnabled={rpeEnabled}
              initial={suggestion}
              submitLabel={t('logging.addSet', { n: exercise.sets.length + 1 })}
              onSubmit={props.onAddSet}
            />
          )}
        </View>
      ) : null}
    </View>
  );
}
