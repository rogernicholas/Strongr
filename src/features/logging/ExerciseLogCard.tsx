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
  /** 1-based place in the workout, and how many exercises it has. */
  position: number;
  total: number;
  previousSets: LoggedSet[];
  unit: WeightUnit;
  rpeEnabled: boolean;
  expanded: boolean;
  onToggle(): void;
  onAddSet(input: SetInput): void;
  onUpdateSet(setId: string, input: SetInput): void;
  onDeleteSet(setId: string): void;
  onRemove(): void;
}

export function ExerciseLogCard(props: Props) {
  const { exercise, previousSets, unit, rpeEnabled, expanded, position, total } = props;
  const { t } = useTranslation();
  const theme = useTheme();
  const formatSet = useFormatSet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = exercise.sets.find((s) => s.id === editingId) ?? null;
  const rowStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 40,
    paddingHorizontal: 8,
    borderRadius: theme.radius.sm,
  } as const;

  // Open cards list last session's sets too, as faint targets for the sets still to do.
  const rows = expanded
    ? Math.max(exercise.sets.length, previousSets.length)
    : exercise.sets.length;
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
        <AppText variant="label">
          {t('logging.position', { n: position, total }).toUpperCase()}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <AppText variant="heading" style={{ flex: 1 }}>
            {exercise.exerciseName}
          </AppText>
          <AppText variant="muted">
            {t('logging.setCount', { count: exercise.sets.length })}
          </AppText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('logging.removeExercise', { name: exercise.exerciseName })}
            onPress={props.onRemove}
            hitSlop={12}
            style={({ pressed }) => ({
              width: 32,
              height: 32,
              marginRight: -6,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: pressed ? theme.colors.raised : 'transparent',
            })}
          >
            <AppText variant="muted" style={{ fontSize: 20, lineHeight: 24 }}>
              ×
            </AppText>
          </Pressable>
        </View>
        {expanded ? (
          <AppText variant="muted">
            {previousSets.length > 0 ? t('logging.lastTimeHeader') : t('logging.firstTime')}
          </AppText>
        ) : null}
      </Pressable>

      {rows > 0 ? (
        <View style={{ paddingHorizontal: 16, paddingBottom: expanded ? 0 : 12, gap: 4 }}>
          {Array.from({ length: rows }, (_, i) => {
            const set = exercise.sets[i];
            const before = previousSets[i];
            const target = before ? (
              <AppText variant="muted" style={{ opacity: set ? 0.7 : 1 }}>
                {formatSet(before)}
              </AppText>
            ) : null;
            const number = (
              <AppText variant="muted" style={{ width: 20 }}>
                {i + 1}
              </AppText>
            );
            if (!set) {
              return (
                <View key={`target-${i}`} style={rowStyle}>
                  {number}
                  {target}
                </View>
              );
            }
            return (
              <Pressable
                key={set.id}
                accessibilityRole="button"
                accessibilityHint={t('logging.tapToEdit')}
                onPress={() => setEditingId(set.id === editingId ? null : set.id)}
                style={[
                  rowStyle,
                  set.id === editingId ? { backgroundColor: theme.colors.background } : null,
                ]}
              >
                {number}
                <AppText variant="heading" style={{ flex: 1 }}>
                  {formatSet(set)}
                  {set.rpe !== null ? `  @${set.rpe}` : ''}
                  {set.isWarmup ? (
                    <AppText variant="muted">{`  ${t('logging.warmupShort')}`}</AppText>
                  ) : null}
                </AppText>
                {expanded ? target : null}
              </Pressable>
            );
          })}
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
