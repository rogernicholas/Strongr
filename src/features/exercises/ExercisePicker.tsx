import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Pressable, SectionList, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useDb } from '@/core/db';
import { useTranslation } from '@/core/i18n';
import { useTheme } from '@/core/theme';
import { createExerciseRepository, type Exercise } from '@/data';
import { AppText, Button, TextField } from '@/ui';

import { AddExerciseForm } from './AddExerciseForm';
import { groupExercises } from './groupExercises';

interface Props {
  initialSelectedIds?: readonly string[];
  /** Shown above the search field, e.g. routine shortcuts. */
  header?: ReactNode;
  /** Actions shown under the list; receives the selection in tap order. */
  renderFooter(selectedIds: string[]): ReactNode;
}

/** Choose exercises for today or for a routine. Order of selection is the workout order. */
export function ExercisePicker({ initialSelectedIds = [], header, renderFooter }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();
  const db = useDb();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selected, setSelected] = useState<string[]>([...initialSelectedIds]);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    void createExerciseRepository(db).list().then(setExercises);
  }, [db]);

  const sections = useMemo(() => groupExercises(exercises, query), [exercises, query]);

  const toggle = useCallback((id: string) => {
    setSelected((current) =>
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }, []);

  const onCreated = (exercise: Exercise) => {
    setExercises((current) => [...current, exercise]);
    setSelected((current) => [...current, exercise.id]);
    setAdding(false);
    setQuery('');
  };

  return (
    <SafeAreaView
      edges={['bottom', 'left', 'right']}
      style={{ flex: 1, backgroundColor: theme.colors.background }}
    >
      <View style={{ padding: 16, gap: 12 }}>
        {header}
        <TextField
          value={query}
          onChangeText={setQuery}
          placeholder={t('exercises.search')}
          accessibilityLabel={t('exercises.search')}
          clearButtonMode="while-editing"
        />
        {adding ? (
          <AddExerciseForm
            initialName={query}
            onCreated={onCreated}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <Button
            label={t('exercises.addOwn')}
            variant="secondary"
            onPress={() => setAdding(true)}
          />
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <AppText variant="muted" style={{ paddingVertical: 24, textAlign: 'center' }}>
            {t('exercises.noMatches')}
          </AppText>
        }
        renderSectionHeader={({ section }) => (
          <AppText variant="label" style={{ marginTop: 16, marginBottom: 8 }}>
            {t(`muscleGroups.${section.key}`).toUpperCase()}
          </AppText>
        )}
        renderItem={({ item }) => {
          const index = selected.indexOf(item.id);
          const isSelected = index >= 0;
          return (
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              onPress={() => toggle(item.id)}
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 12,
                marginBottom: 6,
                borderRadius: theme.radius.md,
                borderWidth: 1,
                borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                backgroundColor: theme.colors.surface,
              }}
            >
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: isSelected ? theme.colors.accent : theme.colors.subtle,
                  backgroundColor: isSelected ? theme.colors.accent : 'transparent',
                }}
              >
                {isSelected ? (
                  <AppText style={{ color: theme.colors.onAccent, fontWeight: '700' }}>
                    {index + 1}
                  </AppText>
                ) : null}
              </View>
              <AppText style={{ flex: 1 }}>{item.name}</AppText>
            </Pressable>
          );
        }}
      />

      <View
        style={{
          padding: 16,
          gap: 8,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.surface,
        }}
      >
        <AppText variant="muted">
          {t('exercises.selectedCount', { count: selected.length })}
        </AppText>
        {renderFooter(selected)}
      </View>
    </SafeAreaView>
  );
}
